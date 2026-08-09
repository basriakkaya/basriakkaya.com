const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:4322';
const debugUrl = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9222';

const targets = await fetch(`${debugUrl}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');

if (!target?.webSocketDebuggerUrl) {
  throw new Error(`Chrome DevTools hedefi bulunamadı: ${debugUrl}`);
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const consoleErrors = [];
const networkErrors = [];
const networkRequests = [];

socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    return message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }

  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
  }

  if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
    networkErrors.push(message.params.errorText);
  }

  if (message.method === 'Network.requestWillBeSent') networkRequests.push(message.params.request.url);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

const navigate = async (path) => {
  const loaded = new Promise((resolve) => {
    const listener = ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Page.loadEventFired') {
        socket.removeEventListener('message', listener);
        resolve();
      }
    };
    socket.addEventListener('message', listener);
  });
  await send('Page.navigate', { url: `${baseUrl}${path}` });
  await loaded;
};

await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Network.enable')]);

const viewports = [320, 360, 390, 768, 1024, 1440];
const layoutResults = [];
for (const width of viewports) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await navigate('/');
  layoutResults.push(await evaluate(`(() => ({
    width: ${width},
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }))()`));
}

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
await navigate('/');
const interactionStart = await evaluate(`(() => {
  const menuButton = document.querySelector('.menu-button');
  menuButton?.click();
  const menuOpened = menuButton?.getAttribute('aria-expanded') === 'true';
  menuButton?.click();
  const menuClosed = menuButton?.getAttribute('aria-expanded') === 'false';
  const contactButton = document.querySelector('#contact-open');
  const dialog = document.querySelector('#contact-dialog');
  contactButton?.click();
  const dialogOpened = dialog?.open === true;
  return { menuOpened, menuClosed, dialogOpened };
})()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
const interactionEnd = await evaluate(`(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    dialogClosed: document.querySelector('#contact-dialog')?.open === false,
    focusReturned: document.activeElement === document.querySelector('#contact-open')
  };
})()`);
const interactions = { ...interactionStart, ...interactionEnd };

const routes = ['/', '/yazilar', '/yazilar/neden-bu-blogu-actim', '/ben-kimim', '/rss.xml', '/robots.txt', '/sitemap-index.xml', '/olmayan-sayfa'];
const statuses = [];
for (const path of routes) {
  const response = await fetch(`${baseUrl}${path}`);
  statuses.push({ path, status: response.status, type: response.headers.get('content-type') });
}

const links = await evaluate(`(() => {
  const hrefs = [...document.querySelectorAll('a')].map((link) => link.href);
  return {
    linkedin: hrefs.some((href) => href.includes('linkedin.com')),
    youtube: hrefs.some((href) => href === 'https://www.youtube.com/@basrikkya'),
    exposedEmailText: document.body.innerText.includes('real0kage@protonmail.com')
  };
})()`);

const adminLayoutResults = [];
for (const width of viewports) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  await navigate('/admin');
  adminLayoutResults.push(await evaluate(`(async () => {
    const gate = document.querySelector('[data-session-gate]');
    const frame = document.querySelector('.ops-frame');
    const sessionButton = document.querySelector('[data-session-enter]');
    const gateVisible = getComputedStyle(gate).display !== 'none';
    const frameHidden = getComputedStyle(frame).display === 'none';
    const gateOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    const gateTouchHeight = sessionButton.getBoundingClientRect().height;

    sessionButton.focus();
    sessionButton.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const buttons = [...document.querySelectorAll('[data-ops-target]')];
    return {
      width: ${width},
      gateVisible,
      frameHidden,
      gateOverflow,
      gateTouchHeight,
      gateHidden: getComputedStyle(gate).display === 'none',
      frameVisible: getComputedStyle(frame).display !== 'none',
      consoleOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      minTouchHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
      overviewVisible: !document.querySelector('[data-ops-view="overview"]').hidden,
      hiddenViews: [...document.querySelectorAll('[data-ops-view][hidden]')].length,
      focusTransferred: document.activeElement === buttons[0],
      granted: document.documentElement.dataset.opsAccess === 'granted'
    };
  })()`));
}

await send('Emulation.setScriptExecutionDisabled', { value: true });
await navigate('/admin');
const adminWithoutJs = await evaluate(`(() => {
  const gate = document.querySelector('[data-session-gate]');
  const frame = document.querySelector('.ops-frame');
  const overview = document.querySelector('[data-ops-view="overview"]');
  return {
    gateHidden: gate && getComputedStyle(gate).display === 'none',
    frameVisible: frame && getComputedStyle(frame).display !== 'none',
    overviewVisible: overview && !overview.hidden && getComputedStyle(overview).display !== 'none',
    text: overview?.innerText.includes('THREAT LEVEL:')
  };
})()`);
await send('Emulation.setScriptExecutionDisabled', { value: false });

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
const adminLoadStart = networkRequests.length;
await navigate('/admin');
await new Promise((resolve) => setTimeout(resolve, 50));
const adminLoadRequests = networkRequests.slice(adminLoadStart);
const adminInteractionStart = networkRequests.length;
const adminInteraction = await evaluate(`(async () => {
  const gate = document.querySelector('[data-session-gate]');
  const frame = document.querySelector('.ops-frame');
  const sessionButton = document.querySelector('[data-session-enter]');
  const access = document.querySelector('[data-ops-target="access"]');
  const systems = document.querySelector('[data-ops-target="systems"]');
  const overview = document.querySelector('[data-ops-target="overview"]');
  const nodeCheck = document.querySelector('[data-node-check]');
  const integrityCheck = document.querySelector('[data-integrity-check]');

  sessionButton.focus(); sessionButton.click();
  await new Promise((resolve) => setTimeout(resolve, 500));
  const sessionOpened = document.documentElement.dataset.opsAccess === 'granted'
    && getComputedStyle(gate).display === 'none'
    && getComputedStyle(frame).display !== 'none';
  const sessionFocus = document.activeElement === overview;

  access.focus(); access.click();
  const accessVisible = !document.querySelector('[data-ops-view="access"]').hidden && access.getAttribute('aria-pressed') === 'true';
  const accessFocus = document.activeElement === access;

  systems.focus(); systems.click();
  const systemsVisible = !document.querySelector('[data-ops-view="systems"]').hidden && systems.getAttribute('aria-pressed') === 'true';
  const systemsFocus = document.activeElement === systems;
  nodeCheck.focus(); nodeCheck.click();
  const nodeCheckFocus = document.activeElement === nodeCheck;
  await new Promise((resolve) => setTimeout(resolve, 1250));
  const nodeComplete = document.querySelector('[data-node-status]').textContent === 'COMPLETE // 7 RESPONDING';

  overview.focus(); overview.click();
  const overviewVisible = !document.querySelector('[data-ops-view="overview"]').hidden && overview.getAttribute('aria-pressed') === 'true';
  const overviewFocus = document.activeElement === overview;
  integrityCheck.focus(); integrityCheck.click();
  const integrityCheckFocus = document.activeElement === integrityCheck;
  await new Promise((resolve) => setTimeout(resolve, 1250));
  return {
    sessionOpened,
    sessionFocus,
    accessVisible,
    systemsVisible,
    overviewVisible,
    nodeComplete,
    integrityComplete: document.querySelector('[data-integrity-status]').textContent === 'INTEGRITY: VERIFIED',
    focusNatural: accessFocus && systemsFocus && nodeCheckFocus && overviewFocus && integrityCheckFocus
  };
})()`);
const adminInteractionRequests = networkRequests.slice(adminInteractionStart);
await navigate('/admin');
await new Promise((resolve) => setTimeout(resolve, 50));
const adminReloadState = await evaluate(`(() => ({
  pending: document.documentElement.dataset.opsAccess === 'pending',
  gateVisible: getComputedStyle(document.querySelector('[data-session-gate]')).display !== 'none',
  frameHidden: getComputedStyle(document.querySelector('.ops-frame')).display === 'none'
}))()`);
const baseOrigin = new URL(baseUrl).origin;
const invalidAdminLoadRequests = adminLoadRequests.filter((requestUrl) => {
  const parsed = new URL(requestUrl);
  return parsed.origin !== baseOrigin || !(/^\/admin\/?$/u.test(parsed.pathname) || parsed.pathname === '/favicon.svg' || parsed.pathname.startsWith('/_astro/'));
});

socket.close();

const failures = [
  ...layoutResults.filter((result) => result.overflow).map((result) => `${result.width}px yatay taşma`),
  ...Object.entries(interactions).filter(([, passed]) => !passed).map(([name]) => `${name} başarısız`),
  ...statuses.filter(({ path, status }) => path === '/olmayan-sayfa' ? status !== 404 : status !== 200).map(({ path, status }) => `${path}: ${status}`),
  ...consoleErrors.map((error) => `Console: ${error}`),
  ...networkErrors.map((error) => `Network: ${error}`),
  ...Object.entries(links).filter(([name, passed]) => name === 'exposedEmailText' ? passed : !passed).map(([name]) => `${name} başarısız`),
  ...adminLayoutResults.filter((result) => result.gateOverflow).map((result) => `/admin ${result.width}px gate yatay taşma`),
  ...adminLayoutResults.filter((result) => result.consoleOverflow).map((result) => `/admin ${result.width}px console yatay taşma`),
  ...adminLayoutResults.filter((result) => result.gateTouchHeight < 44).map((result) => `/admin ${result.width}px gate touch target ${result.gateTouchHeight}`),
  ...adminLayoutResults.filter((result) => result.minTouchHeight < 44).map((result) => `/admin ${result.width}px touch target ${result.minTouchHeight}`),
  ...adminLayoutResults.filter((result) => !result.gateVisible || !result.frameHidden).map((result) => `/admin ${result.width}px initial gate state yanlış`),
  ...adminLayoutResults.filter((result) => !result.gateHidden || !result.frameVisible || !result.granted || !result.focusTransferred || !result.overviewVisible || result.hiddenViews !== 2).map((result) => `/admin ${result.width}px granted panel state yanlış`),
  ...Object.entries(adminWithoutJs).filter(([, passed]) => !passed).map(([name]) => `/admin JavaScript-off ${name} başarısız`),
  ...Object.entries(adminInteraction).filter(([, passed]) => !passed).map(([name]) => `/admin ${name} başarısız`),
  ...Object.entries(adminReloadState).filter(([, passed]) => !passed).map(([name]) => `/admin reload ${name} başarısız`),
  ...invalidAdminLoadRequests.map((url) => `/admin izin verilmeyen load request: ${url}`),
  ...adminInteractionRequests.map((url) => `/admin interaction sonrası request: ${url}`),
];

console.log(JSON.stringify({ baseUrl, layoutResults, interactions, statuses, links, adminLayoutResults, adminWithoutJs, adminInteraction, adminReloadState, adminLoadRequests, adminInteractionRequests, consoleErrors, networkErrors }, null, 2));
if (failures.length) {
  console.error(`Tarayıcı denetimi başarısız:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Tarayıcı denetimi başarılı.');
}
