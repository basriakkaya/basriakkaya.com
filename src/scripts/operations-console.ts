const ipOutput = document.querySelector<HTMLElement>('[data-client-ip]');
const form = document.querySelector<HTMLFormElement>('[data-admin-form]');
const response = document.querySelector<HTMLElement>('[data-admin-response]');
const operatorId = document.querySelector<HTMLInputElement>('#operator-id');
const accessKey = document.querySelector<HTMLInputElement>('#access-key');
const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');

async function resolveClientAddress() {
  if (!ipOutput) return;
  try {
    const request = await fetch('/api/visitor-ip', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!request.ok) throw new Error('address unavailable');
    const payload: unknown = await request.json();
    const address = typeof payload === 'object' && payload !== null && 'ip' in payload
      ? String(payload.ip)
      : '';
    ipOutput.textContent = address || 'unavailable';
  } catch {
    ipOutput.textContent = 'unavailable';
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (operatorId) operatorId.value = '';
  if (accessKey) accessKey.value = '';
  if (response) response.textContent = 'Invalid username or password.';

  try {
    const alertRequest = await fetch('/api/admin-alert', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      keepalive: true,
    });
    if (alertRequest.status === 403 || alertRequest.status === 429) {
      if (response) response.textContent = 'Too many attempts. Access blocked.';
      if (operatorId) operatorId.disabled = true;
      if (accessKey) accessKey.disabled = true;
      if (submitButton) submitButton.disabled = true;
    }
  } catch {
    // Authentication remains denied when the monitoring endpoint is unavailable.
  }
});

void resolveClientAddress();
