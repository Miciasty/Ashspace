// Build Tailwind once, then watch the sources beside the local preview server.
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const cliPackage = path.join(root, 'node_modules/@tailwindcss/cli/package.json');
let cli;
try {
  const manifest = JSON.parse(await readFile(cliPackage, 'utf8'));
  cli = path.resolve(path.dirname(cliPackage), manifest.bin.tailwindcss);
} catch {
  console.error('Tailwind is not installed. Run npm ci in the wiki directory first.');
  process.exit(1);
}
const args = ['-i', './src/input.css', '-o', './assets/styles.css'];
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function start(file, extra = []) {
  const child = spawn(process.execPath, [file, ...extra], {cwd:root, stdio:'inherit', windowsHide:true});
  children.add(child);
  child.once('error', error => { console.error(error.message); stop(1); });
  child.once('exit', code => { children.delete(child); if (!stopping && file.endsWith('preview.mjs')) stop(code ?? 1); });
  return child;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
const build = start(cli, args);
const status = await new Promise(resolve => { build.once('exit', resolve); build.once('error', () => resolve(1)); });
if (status !== 0 || stopping) process.exit(status || 1);
const watcher = start(cli, [...args, '--watch=always']);
watcher.once('exit', code => { if (!stopping) stop(code || 1); });
start(path.join(root, 'preview.mjs'));
console.log('Tailwind watches HTML, content, and styles. Refresh the browser after saving changes.');
