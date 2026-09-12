// Publish browser files only. The authoring tools and notes stay in the repository.
import {cp, mkdir, readdir, realpath, lstat, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = await realpath(fileURLToPath(new URL('.', import.meta.url)));
const output = path.join(root, '_site');
// Delete only this build's fixed, verified output; refuse links/junctions elsewhere.
try {
  const existing = await lstat(output);
  const resolved = await realpath(output);
  if (!existing.isDirectory() || existing.isSymbolicLink() || resolved !== output || path.dirname(resolved) !== root) {
    throw new Error(`Refusing to replace an unexpected output path: ${output}`);
  }
  await rm(output, {recursive:true});
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(output, {recursive:true});
const publicFiles = ['index.html', '.nojekyll', 'assets', 'content'];
for (const file of publicFiles) await cp(path.join(root,file), path.join(output,file), {recursive:true});
for (const file of ['LICENSE','NOTICE']) await cp(path.join(root,'..',file),path.join(output,file));
const forbidden = (await readdir(output)).filter(file => ![...publicFiles,'LICENSE','NOTICE'].includes(file));
if (forbidden.length) throw new Error(`Unexpected files in _site: ${forbidden.join(', ')}. Use a fresh output directory.`);
console.log('Built wiki/_site for GitHub Pages (HTML, CSS, JavaScript, license and notice).');
