const ipOutput = document.querySelector<HTMLElement>('[data-client-ip]');
const form = document.querySelector<HTMLFormElement>('[data-admin-form]');
const response = document.querySelector<HTMLElement>('[data-admin-response]');
const accessKey = document.querySelector<HTMLInputElement>('#access-key');

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

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (accessKey) accessKey.value = '';
  if (response) response.textContent = 'ACCESS DENIED // authorization could not be verified';
});

void resolveClientAddress();
