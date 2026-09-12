// Validate authored data and internal links without installing dependencies.
import {readFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('.', import.meta.url));
const context = vm.createContext({window:{}});
const errors = [];
const shell=await readFile(path.join(root,'index.html'),'utf8');
const contentFiles = [...shell.matchAll(/<script src="\.\/(content\/[^" ]+)"/g)].map(match => match[1]);
for (const file of contentFiles) {
  vm.runInContext(await readFile(path.join(root,file),'utf8'),context,{filename:file,timeout:1000});
}
const config = context.window.WIKI_CONFIG;
const pages = context.window.WIKI_PAGES;
if (!config || !Array.isArray(pages) || !pages.length) throw new Error('Expected WIKI_CONFIG and a non-empty WIKI_PAGES array.');
const ids = new Set();
const sections = new Map();
for (const page of pages) {
  if (!page.id || ids.has(page.id)) errors.push(`Missing or duplicate page ID: ${page.id}`);
  ids.add(page.id);
  if (!page.title || !page.description || !page.category) errors.push(`${page.id}: title, description, and category are required.`);
  if (!['guide', 'reference', 'concept'].includes(page.kind)) errors.push(`${page.id}: kind must be guide, reference, or concept.`);
  if (!Array.isArray(page.sections)) { errors.push(`${page.id}: sections must be an array.`); continue; }
  const sectionIds = new Set();
  for (const section of page.sections) {
    if (!section.id || sectionIds.has(section.id)) errors.push(`${page.id}: missing or duplicate section ID ${section.id}`);
    if (!section.title || typeof section.html !== 'string') errors.push(`${page.id}/${section.id}: title and html are required.`);
    sectionIds.add(section.id);
  }
  sections.set(page.id,sectionIds);
}
if (!config.product) errors.push('A product name is required.');
if (!ids.has(config.defaultPage)) errors.push(`Unknown defaultPage: ${config.defaultPage}`);
const navigationIds = new Set();
for (const group of config.navigation || []) {
  if (!group.title || !Array.isArray(group.items)) { errors.push('Each navigation group needs a title and items array.'); continue; }
  for (const id of group.items) {
    if (!ids.has(id)) errors.push(`Navigation references unknown page: ${id}`);
    if (navigationIds.has(id)) errors.push(`Repeated navigation entry: ${id}`);
    navigationIds.add(id);
  }
}
if (!navigationIds.size) errors.push('Navigation must contain at least one page.');
for (const id of ids) if (!navigationIds.has(id)) errors.push(`Page missing from navigation: ${id}`);
if (config.demo !== false) errors.push('Product documentation must disable demo mode.');
const pom = await readFile(path.resolve(root,'../pom.xml'),'utf8');
if (config.version !== pom.match(/<version>([^<]+)<\/version>/)?.[1]) errors.push('WIKI version differs from pom.xml.');
for (const [,id] of shell.matchAll(/href="#\/([^"?]+)"/g)) {
  if (!ids.has(id)) errors.push(`Header or shell links to unknown page: ${id}`);
}
for (const [name,url] of Object.entries(config.links || {})) {
  if (url && !/^https?:\/\//i.test(url)) errors.push(`links.${name} must be an absolute HTTP(S) URL or an empty string.`);
}
let linkCount=0;
for (const page of pages) {
  const html = [page.intro || '', ...(page.sections || []).map(s=>s.html)].join('\n');
  for (const match of html.matchAll(/href=["']#\/([^"']+)["']/g)) {
    linkCount++;
    const [rawId,query=''] = match[1].split('?');
    const id=decodeURIComponent(rawId);
    const section=new URLSearchParams(query).get('section');
    if(!ids.has(id)) errors.push(`${page.id}: link to unknown page ${id}`);
    else if(section&&!sections.get(id)?.has(section)) errors.push(`${page.id}: link to unknown section ${id}/${section}`);
  }
  for (const match of html.matchAll(/data-diagram=["']([^"']+)["']/g)) {
    if(!['coordinates','composition','frame-chain','grid','ranges','snapshots','geometry'].includes(match[1])) errors.push(`${page.id}: unknown diagram ${match[1]}`);
  }
  for (const match of html.matchAll(/(?:src|poster)=["']([^"']+)["']/g)) {
    if (/^(https?:|data:)/.test(match[1])) continue;
    if (match[1].startsWith('/')) errors.push(`${page.id}: use relative asset path ${match[1]}`);
    else { try { await access(path.join(root,match[1])); } catch { errors.push(`${page.id}: missing asset ${match[1]}`); } }
  }
  if (/Shelter|fictional plugin|\{\{[^}]+\}\}/i.test(html)) errors.push(`${page.id}: demonstration or placeholder content remains.`);
}
for (const match of shell.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
  try { await access(path.join(root,match[1])); } catch { errors.push(`Missing shell asset: ${match[1]}`); }
}
if(errors.length) { console.error(errors.map(error=>`- ${error}`).join('\n')); process.exitCode=1; }
else console.log(`Checked ${pages.length} pages, ${[...sections.values()].reduce((sum,set)=>sum+set.size,0)} sections, ${linkCount} content links, navigation, and local assets.`);
