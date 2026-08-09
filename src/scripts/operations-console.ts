const navButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-ops-target]')];
const views = [...document.querySelectorAll<HTMLElement>('[data-ops-view]')];
const sessionButton = document.querySelector<HTMLButtonElement>('[data-session-enter]');
const sessionStatus = document.querySelector<HTMLElement>('[data-session-status]');

sessionButton?.addEventListener('click', () => {
  if (sessionButton.getAttribute('aria-disabled') === 'true') return;
  sessionButton.setAttribute('aria-disabled', 'true');
  if (sessionStatus) sessionStatus.textContent = 'AUTHORIZATION ACCEPTED // OPENING';
  window.setTimeout(() => {
    document.documentElement.dataset.opsAccess = 'granted';
    sessionButton.removeAttribute('aria-disabled');
    navButtons[0]?.focus();
  }, 420);
});

for (const button of navButtons) {
  button.addEventListener('click', () => {
    const target = button.dataset.opsTarget;
    for (const item of navButtons) item.setAttribute('aria-pressed', String(item === button));
    for (const view of views) view.hidden = view.dataset.opsView !== target;
  });
}

function runCheck(button: HTMLButtonElement, status: HTMLElement, running: string, complete: string) {
  if (button.getAttribute('aria-disabled') === 'true') return;
  button.setAttribute('aria-disabled', 'true');
  status.textContent = running;
  window.setTimeout(() => {
    status.textContent = complete;
    button.removeAttribute('aria-disabled');
  }, 1200);
}

const integrityButton = document.querySelector<HTMLButtonElement>('[data-integrity-check]');
const integrityStatus = document.querySelector<HTMLElement>('[data-integrity-status]');
integrityButton?.addEventListener('click', () => {
  if (integrityStatus) runCheck(integrityButton, integrityStatus, 'RUNNING CHECKSUM…', 'INTEGRITY: VERIFIED');
});

const nodeButton = document.querySelector<HTMLButtonElement>('[data-node-check]');
const nodeStatus = document.querySelector<HTMLElement>('[data-node-status]');
nodeButton?.addEventListener('click', () => {
  if (nodeStatus) runCheck(nodeButton, nodeStatus, 'CHECKING // 7 TARGETS', 'COMPLETE // 7 RESPONDING');
});
