import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const removed = ["src/pages/admin.astro", "src/layouts/OperationsConsoleLayout.astro", "src/components/operations/OperationsConsole.astro", "src/scripts/operations-console.ts", "src/styles/operations-console.css", "api/admin-alert.js", "api/visitor-ip.js", "dist/admin/index.html"];
const failures=[];
for(const file of removed){try{await access(file);failures.push(`Removed admin artifact still exists: ${file}`);}catch{}}
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await scan(p);else if(/\.(html|js|css)$/.test(p)){const text=await readFile(p,'utf8');if(/data-admin-form|api\/admin-alert|api\/visitor-ip|operations-console/.test(text))failures.push(`Legacy admin code in ${p}`);}}}
await scan('dist');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Admin removal audit passed: no legacy login, endpoints or bundled client code.');
