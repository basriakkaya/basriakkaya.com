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
  adminLayoutResults.push(await evaluate(`(() => {
    const controls = [...document.querySelectorAll('.admin-form input, .admin-form button')];
    return {
      width: ${width},
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      cardVisible: Boolean(document.querySelector('.admin-card')?.getBoundingClientRect().height),
      controlCount: controls.length,
      minTouchHeight: Math.min(...controls.map((control) => control.getBoundingClientRect().height))
    };
  })()`));
}

await send('Emulation.setScriptExecutionDisabled', { value: true });
await navigate('/admin');
const adminWithoutJs = await evaluate(`(() => {
  const form = document.querySelector('[data-admin-form]');
  return {
    formVisible: Boolean(form && getComputedStyle(form).display !== 'none'),
    title: document.querySelector('h1')?.textContent === 'Admin Login',
    inputs: form?.querySelectorAll('input').length === 2
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
  const form = document.querySelector('[data-admin-form]');
  const username = document.querySelector('#operator-id');
  const password = document.querySelector('#access-key');
  const button = form.querySelector('button[type="submit"]');
  username.focus();
  const usernameFocus = document.activeElement === username;
  password.focus();
  const passwordFocus = document.activeElement === password;
  button.focus();
  const buttonFocus = document.activeElement === button;
  username.value = 'audit-user';
  password.value = 'audit-secret';
  form.requestSubmit();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    credentialsCleared: username.value === '' && password.value === '',
    deniedMessage: document.querySelector('[data-admin-response]').textContent === 'Invalid username or password.',
    focusNatural: usernameFocus && passwordFocus && buttonFocus
  };
})()`);
const adminInteractionRequests = networkRequests.slice(adminInteractionStart);
const baseOrigin = new URL(baseUrl).origin;
const invalidAdminLoadRequests = adminLoadRequests.filter((requestUrl) => {
  const parsed = new URL(requestUrl);
  return parsed.origin !== baseOrigin || !(/^\/admin\/?$/u.test(parsed.pathname) || parsed.pathname === '/favicon.svg' || parsed.pathname.startsWith('/_astro/'));
});
const invalidAdminInteractionRequests = adminInteractionRequests.filter((requestUrl) => {
  const parsed = new URL(requestUrl);
  return parsed.origin !== baseOrigin || parsed.pathname !== '/api/admin-alert';
});

socket.close();

const failures = [
  ...layoutResults.filter((result) => result.overflow).map((result) => `${result.width}px yatay taşma`),
  ...Object.entries(interactions).filter(([, passed]) => !passed).map(([name]) => `${name} başarısız`),
  ...statuses.filter(({ path, status }) => path === '/olmayan-sayfa' ? status !== 404 : status !== 200).map(({ path, status }) => `${path}: ${status}`),
  ...consoleErrors.map((error) => `Console: ${error}`),
  ...networkErrors.map((error) => `Network: ${error}`),
  ...Object.entries(links).filter(([name, passed]) => name === 'exposedEmailText' ? passed : !passed).map(([name]) => `${name} başarısız`),
  ...adminLayoutResults.filter((result) => result.overflow).map((result) => `/admin ${result.width}px yatay taşma`),
  ...adminLayoutResults.filter((result) => result.minTouchHeight < 44).map((result) => `/admin ${result.width}px touch target ${result.minTouchHeight}`),
  ...adminLayoutResults.filter((result) => !result.cardVisible || result.controlCount !== 3).map((result) => `/admin ${result.width}px login kontrol yapısı yanlış`),
  ...Object.entries(adminWithoutJs).filter(([, passed]) => !passed).map(([name]) => `/admin JavaScript-off ${name} başarısız`),
  ...Object.entries(adminInteraction).filter(([, passed]) => !passed).map(([name]) => `/admin ${name} başarısız`),
  ...invalidAdminLoadRequests.map((url) => `/admin izin verilmeyen load request: ${url}`),
  ...invalidAdminInteractionRequests.map((url) => `/admin interaction sonrası izin verilmeyen request: ${url}`),
  ...(adminInteractionRequests.length !== 1 ? [`/admin interaction request sayısı ${adminInteractionRequests.length}, beklenen 1`] : []),
];

console.log(JSON.stringify({ baseUrl, layoutResults, interactions, statuses, links, adminLayoutResults, adminWithoutJs, adminInteraction, adminLoadRequests, adminInteractionRequests, consoleErrors, networkErrors }, null, 2));
if (failures.length) {
  console.error(`Tarayıcı denetimi başarısız:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Tarayıcı denetimi başarılı.');
}
