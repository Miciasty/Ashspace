// Compile the actual Java blocks readers copy, against this checkout's library source.
import {readFile, readdir, mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';

const root = fileURLToPath(new URL('.', import.meta.url));
let dependencyClasspath = process.env.ASHSPACE_EXAMPLE_CLASSPATH;
if (!dependencyClasspath) {
  try { dependencyClasspath = (await readFile(path.resolve(root,'../target/wiki-classpath.txt'),'utf8')).trim(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (!dependencyClasspath) {
  const repository = process.env.MAVEN_REPO_LOCAL || path.join(homedir(),'.m2','repository');
  const pom = await readFile(path.resolve(root,'../pom.xml'),'utf8');
  const libraries = [...pom.matchAll(/<dependency>\s*<groupId>dev\.nasaka\.blackframe<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*<version>([^<]+)<\/version>/g)];
  dependencyClasspath = libraries.map(([,name,version])=>path.join(repository,'dev','nasaka','blackframe',name,version,`${name}-${version}.jar`)).join(path.delimiter);
}
if (!dependencyClasspath) throw new Error('Resolve the Maven dependencies first; see wiki/README.md.');
const context = vm.createContext({window:{}});
const shell = await readFile(path.join(root,'index.html'),'utf8');
for (const [,file] of shell.matchAll(/<script src="\.\/(content\/[^" ]+)"/g)) {
  vm.runInContext(await readFile(path.join(root,file),'utf8'),context,{filename:file,timeout:1000});
}
const verification = path.resolve(root,'../.verification');
await mkdir(verification,{recursive:true});
const work = await mkdtemp(path.join(verification,'wiki-examples-'));
const classes = path.join(work,'classes');
await mkdir(classes);
const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[entity]));
const examples = [];
for (const page of context.window.WIKI_PAGES) {
  const html = [page.intro || '', ...page.sections.map(section=>section.html)].join('\n');
  for (const [,block] of html.matchAll(/<div[^>]*data-language="java"[^>]*>[\s\S]*?<pre><code>([\s\S]*?)<\/code><\/pre>/g)) {
    const source = decode(block);
    const name = source.match(/public\s+(?:final\s+)?class\s+(\w+)/)?.[1];
    if (!name || !/static\s+void\s+main\s*\(/.test(source)) continue;
    if (!/\bassert\s/.test(source)) throw new Error(`${name}: add an assertion for the result explained by this example.`);
    if (examples.some(example=>example.name === name)) throw new Error(`Duplicate example class ${name}`);
    const file = path.join(work,`${name}.java`);
    await writeFile(file,source);
    examples.push({file,name,page:page.id});
  }
}
if (!examples.length) throw new Error('No executable Java examples found.');
async function javaFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const file = path.join(directory,entry.name);
    if (entry.isDirectory()) result.push(...await javaFiles(file));
    else if (entry.name.endsWith('.java')) result.push(file);
  }
  return result;
}
const sources = [...await javaFiles(path.resolve(root,'../src/main/java')), ...examples.map(example=>example.file)];
const argsFile = path.join(work,'sources.txt');
await writeFile(argsFile,sources.map(file=>`"${file.replaceAll('\\','/')}"`).join('\n'));
const executable = name => process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin',name + (process.platform === 'win32' ? '.exe' : '')) : name;
function run(name,args) {
  const result = spawnSync(executable(name),args,{encoding:'utf8',windowsHide:true,timeout:60000});
  if (result.error || result.status !== 0) throw new Error(`${name} failed:\n${result.error || ''}\n${result.stdout || ''}${result.stderr || ''}`);
  return result.stdout.trim();
}
run('javac',['--release','21','-encoding','UTF-8','-cp',dependencyClasspath,'-d',classes,`@${argsFile}`]);
for (const example of examples) {
  const output = run('java',['-ea','-cp',classes + path.delimiter + dependencyClasspath,example.name]);
  console.log(`PASS ${example.page}: ${example.name}${output ? `\n${output}` : ''}`);
}
console.log(`Compiled Ashspace source and ran ${examples.length} documentation examples with assertions enabled.`);
