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

const viewports = [360, 390, 768, 1024, 1440];
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

socket.close();

const failures = [
  ...layoutResults.filter((result) => result.overflow).map((result) => `${result.width}px yatay taşma`),
  ...Object.entries(interactions).filter(([, passed]) => !passed).map(([name]) => `${name} başarısız`),
  ...statuses.filter(({ path, status }) => path === '/olmayan-sayfa' ? status !== 404 : status !== 200).map(({ path, status }) => `${path}: ${status}`),
  ...consoleErrors.map((error) => `Console: ${error}`),
  ...networkErrors.map((error) => `Network: ${error}`),
  ...Object.entries(links).filter(([name, passed]) => name === 'exposedEmailText' ? passed : !passed).map(([name]) => `${name} başarısız`),
];

console.log(JSON.stringify({ baseUrl, layoutResults, interactions, statuses, links, consoleErrors, networkErrors }, null, 2));
if (failures.length) {
  console.error(`Tarayıcı denetimi başarısız:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Tarayıcı denetimi başarılı.');
}
