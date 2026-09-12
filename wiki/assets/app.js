/* Static documentation runtime. Content is trusted, locally authored HTML. */
(() => {
  'use strict';
  const config = window.WIKI_CONFIG;
  const pages = window.WIKI_PAGES;
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const copyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></svg>';
  const article = $('#article');
  if (!config || !Array.isArray(pages) || !pages.length) {
    article.innerHTML = '<h1>Documentation is unavailable</h1><p>Check that content/site.js and content/pages.js are present and contain valid JavaScript.</p>';
    return;
  }
  const pageMap = new Map(pages.map(page => [page.id, page]));
  const route = (id, section) => `#/${encodeURIComponent(id)}${section ? `?section=${encodeURIComponent(section)}` : ''}`;
  const defaultPage = pageMap.has(config.defaultPage) ? config.defaultPage : pages[0].id;
  const navIds = [...new Set((config.navigation || []).flatMap(group => group.items).filter(id => pageMap.has(id)))];
  let currentPageId = null;
  let disposeDiagrams = null;
  let toastTimer;
  let scrollFrame = 0;
  const searchDialog = $('#search-dialog');
  const searchInput = $('#search-input');
  let selectedResult = 0;
  let results = [];
  let lastSearchOpener = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showToast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2400);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* file URLs and browser policies may require the selection fallback. */ }
    const input = document.createElement('textarea');
    input.value = text;
    input.style.cssText = 'position:fixed;left:-9999px;top:0';
    input.setAttribute('aria-label', 'Text to copy');
    document.body.append(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Report failure below. */ }
    input.remove();
    return copied;
  }

  const storageKey = `wiki-theme:${config.brand || 'docs'}`;
  function setTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    const next = theme === 'dark' ? 'light' : 'dark';
    $('.theme-toggle').setAttribute('aria-label', `Switch to ${next} theme`);
    $('.theme-toggle').title = `Switch to ${next} theme`;
    if (persist) { try { localStorage.setItem(storageKey, theme); } catch { /* Theme still works without storage. */ } }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem(storageKey) || 'dark'; } catch { /* Default dark palette. */ }
  setTheme(savedTheme === 'light' ? 'light' : 'dark', false);
  $('.theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));

  $('#brand-name').textContent = config.brand || 'Documentation';
  $('#header-product').textContent = config.product;
  $('#sidebar-product').textContent = config.product;
  $('#product-version').textContent = config.version || 'Documentation';
  $('.product-symbol').textContent = (config.product || 'D').slice(0, 1);
  $('.brand').href = route(defaultPage);
  $('.product-card').href = route(pageMap.has('overview') ? 'overview' : defaultPage);
  $('#sidebar-note').textContent = config.demo ? 'Fictional plugin · example content' : `${config.product} documentation`;
  $('#outline-caption').textContent = config.demo ? 'A reusable template. Examples do not describe a released plugin.' : config.version || '';
  const downloadUrl = safeExternalLink(config.links?.download);
  if (downloadUrl) {
    const downloadLink = document.createElement('a');
    downloadLink.className = 'download-link whitespace-nowrap text-[11px] text-accent hover:underline';
    downloadLink.href = downloadUrl;
    downloadLink.textContent = 'Download ↗';
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    $('.header-actions').prepend(downloadLink);
  }
  all('.header-nav a').forEach(link => { const id = link.hash.slice(2); link.hidden = !pageMap.has(id); });
  if (navigator.platform.toLowerCase().includes('mac')) $('.search-trigger kbd').textContent = '⌘ K';

  $('#page-navigation').innerHTML = (config.navigation || []).map(group => `<section class="nav-group mb-7"><h2 class="nav-heading mb-3 font-mono text-[10px] leading-[normal] font-medium tracking-[.085em] text-muted uppercase">${escape(group.title)}</h2><div class="nav-links flex flex-col border-l border-line">${group.items.filter(id => pageMap.has(id)).map(id => `<a class="nav-link relative -ml-px border-l border-transparent py-[7px] pr-2 pl-[14px] text-[13px] leading-[1.5] text-muted hover:bg-surface hover:text-foreground aria-[current=page]:border-accent aria-[current=page]:bg-[linear-gradient(90deg,var(--accent-soft),transparent)] aria-[current=page]:font-medium aria-[current=page]:text-accent" data-page="${escape(id)}" href="${route(id)}">${escape(pageMap.get(id).navTitle || pageMap.get(id).title)}</a>`).join('')}</div></section>`).join('');

  function closeMenu(restoreFocus = false) {
    $('#sidebar').classList.remove('is-open');
    $('#sidebar').removeAttribute('role');
    $('#sidebar').removeAttribute('aria-modal');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').setAttribute('aria-label', 'Open navigation');
    $('.nav-backdrop').hidden = true;
    document.body.style.overflow = '';
    if (restoreFocus) $('.menu-toggle').focus();
  }
  $('.menu-toggle').addEventListener('click', () => {
    const open = !$('#sidebar').classList.contains('is-open');
    if (!open) { closeMenu(true); return; }
    $('#sidebar').classList.add('is-open');
    $('#sidebar').setAttribute('role', 'dialog');
    $('#sidebar').setAttribute('aria-modal', 'true');
    $('.nav-backdrop').hidden = false;
    $('.menu-toggle').setAttribute('aria-expanded', 'true');
    $('.menu-toggle').setAttribute('aria-label', 'Close navigation');
    document.body.style.overflow = 'hidden';
    $('.nav-link[aria-current="page"]')?.focus();
  });
  $('.nav-backdrop').addEventListener('click', () => closeMenu(true));
  $('#sidebar').addEventListener('click', event => {
    if (event.target.closest('a')) {
      const wasOpen = $('#sidebar').classList.contains('is-open');
      closeMenu();
      if (wasOpen) $('#main').focus({preventScroll:true});
    }
  });
  window.matchMedia('(min-width: 681px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  function prepareCodeBlocks() {
    all('.code-block', article).forEach(block => {
      const code = $('code', block);
      if (!code) return;
      const language = block.dataset.language || 'text';
      const filename = block.dataset.filename || language;
      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar flex items-center justify-between gap-2.5 border-b border-line px-[13px] py-[9px] font-mono text-[10px] leading-[normal] text-muted';
      toolbar.innerHTML = `<span class="code-filename flex items-center gap-2"><span class="code-dot size-1.5 rounded-[1px] border border-accent" aria-hidden="true"></span>${escape(filename)}</span><span class="code-actions flex items-center gap-[15px]"><span class="code-language text-[9px] text-subtle uppercase">${escape(language)}</span><button class="copy-code flex items-center gap-[5px] px-0 py-px text-[10px] text-muted hover:text-foreground [&_svg]:size-3 print:hidden" type="button" aria-label="Copy ${escape(filename)}">${copyIcon}<span>Copy</span></button></span>`;
      block.prepend(toolbar);
      const plain = code.textContent;
      const syntax = window.WikiSyntax?.highlight(plain, language);
      if (syntax) {
        code.classList.add('syntax-code', `language-${syntax.id}`);
        code.innerHTML = syntax.html;
      }
      const button = $('button', toolbar);
      button.addEventListener('click', async () => {
        const ok = await copyText(plain);
        showToast(ok ? `${filename} copied` : 'Copy is unavailable. Select and copy the code manually.');
        button.focus({preventScroll:true});
      });
    });
  }

  function parseRoute() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [rawPage, query = ''] = hash.split('?');
    let id;
    try { id = decodeURIComponent(rawPage) || defaultPage; } catch { id = rawPage; }
    if (id === 'changelog') {
      id = 'migration';
      history.replaceState(null, '', `#/migration${query ? `?${query}` : ''}`);
    }
    return { id, section: new URLSearchParams(query).get('section') };
  }
  function updateOutline() {
    const sections = all('.doc-section', article);
    let active = sections[0]?.dataset.sectionId;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 150) active = section.dataset.sectionId; });
    all('.toc-link').forEach(link => {
      if (link.dataset.section === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestOutlineUpdate() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; updateOutline(); });
  }
  window.addEventListener('scroll', requestOutlineUpdate, {passive:true});
  window.addEventListener('resize', requestOutlineUpdate, {passive:true});

  function safeExternalLink(value) {
    if (!value) return '';
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function render() {
    const {id, section} = parseRoute();
    const page = pageMap.get(id);
    const pageChanged = currentPageId !== id;
    if (pageChanged) {
      if (disposeDiagrams) disposeDiagrams();
      disposeDiagrams = null;
      if (!page) {
        article.innerHTML = `<div class="article-header relative pb-[13px] max-[680px]:pb-[14px]"><p class="article-eyebrow mt-0 mb-2.5 font-mono text-[10px] leading-[normal] tracking-[.075em] text-accent uppercase">Documentation</p><h1>Page not found</h1><p>The requested page is not part of this documentation.</p></div><p><a href="${route(defaultPage)}">Return to documentation</a></p>`;
        $('#table-of-contents').innerHTML = '';
        document.title = `Page not found · ${config.product}`;
        $('meta[name="description"]').content = config.description || `${config.product} documentation`;
      } else {
        const index = navIds.indexOf(id);
        const previous = index > 0 ? pageMap.get(navIds[index - 1]) : null;
        const next = index >= 0 && index < navIds.length - 1 ? pageMap.get(navIds[index + 1]) : null;
        const repo = safeExternalLink(config.links?.github);
        article.innerHTML = `<header class="article-header relative pb-[13px] max-[680px]:pb-[14px]"><div class="breadcrumb mb-[26px] flex items-center gap-[9px] text-[11px] text-subtle [&_svg]:size-[11px] [&_a:hover]:text-accent max-[680px]:mb-[22px]"><a href="${route(pageMap.has('overview') ? 'overview' : defaultPage)}">Docs</a>${arrow}<span>${escape(page.category)}</span>${arrow}<span>${escape(page.navTitle || page.title)}</span></div><p class="article-eyebrow mt-0 mb-2.5 font-mono text-[10px] leading-[normal] tracking-[.075em] text-accent uppercase">${escape(page.kind || 'Documentation')}</p><h1>${escape(page.title)}</h1><p class="article-lead m-0 max-w-[690px] text-[16px] leading-[1.7] text-muted max-[680px]:text-[15px]">${escape(page.description)}</p><div class="article-meta mt-5 flex items-center gap-[9px] font-mono text-[10px] leading-[normal] text-subtle max-[680px]:flex-wrap max-[680px]:text-[9px]"><span>${escape(config.product)}</span><span class="meta-divider size-[3px] rounded-full bg-subtle"></span><span>${escape(config.version || 'Documentation')}</span>${page.readingTime ? `<span class="meta-divider size-[3px] rounded-full bg-subtle"></span><span>${escape(page.readingTime)} min read</span>` : ''}</div></header>${page.intro || ''}${page.sections.map(item => `<section class="doc-section mt-7 mb-[39px] scroll-mt-[100px] [&+.doc-section]:pt-[3px] max-[680px]:mt-[23px] max-[680px]:mb-8" id="${escape(item.id)}"><h2 class="group">${escape(item.title)}<a class="heading-link ml-[9px] inline-block text-[16px] font-normal text-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-[680px]:opacity-45" href="${route(page.id, item.id)}" aria-label="Link to ${escape(item.title)}">#</a></h2>${item.html}</section>`).join('')}<nav class="page-pagination mt-[49px] grid grid-cols-2 gap-[22px] border-t border-line pt-[26px] [&_a]:text-[13px] [&_a:hover]:text-accent [&_a:last-child]:col-start-2 [&_a:last-child]:text-right [&_span]:mb-[5px] [&_span]:block [&_span]:text-[10px] [&_span]:text-subtle max-[680px]:gap-[15px] print:hidden" aria-label="Previous and next page">${previous ? `<a href="${route(previous.id)}"><span>← Previous</span>${escape(previous.navTitle || previous.title)}</a>` : '<div></div>'}${next ? `<a href="${route(next.id)}"><span>Next →</span>${escape(next.navTitle || next.title)}</a>` : ''}</nav><footer class="article-footer mt-[45px] flex justify-between gap-5 border-t border-line pt-5 text-[10px] text-subtle [&_a:hover]:text-accent max-[680px]:text-[9px] print:hidden"><span>${escape(config.brand || config.product)} documentation</span>${repo ? `<a href="${escape(repo)}" target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>` : '<span>Built for clear explanations.</span>'}</footer>`;
        all('.doc-section', article).forEach(sectionElement => {
          sectionElement.dataset.sectionId = sectionElement.id;
          sectionElement.id = `doc-section-${sectionElement.id}`;
        });
        if (config.demo) {
          $('.article-meta', article).insertAdjacentHTML('beforeend', '<span class="meta-divider size-[3px] rounded-full bg-subtle"></span><span class="example-badge text-accent">Example content</span>');
        }
        $('#table-of-contents').innerHTML = page.sections.map(item => `<a class="toc-link -ml-px border-l border-transparent py-[5px] pl-[13px] text-[11px] leading-[1.5] text-muted hover:text-foreground aria-[current=location]:border-accent aria-[current=location]:text-accent" data-section="${escape(item.id)}" href="${route(id, item.id)}">${escape(item.title)}</a>`).join('');
        document.title = `${page.title} · ${config.product}`;
        $('meta[name="description"]').content = page.description;
        prepareCodeBlocks();
        if (window.WikiDiagrams) disposeDiagrams = window.WikiDiagrams.mount(article);
      }
      all('.nav-link').forEach(link => {
        if (link.dataset.page === id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
      all('.header-nav a').forEach(link => {
        const top = id === 'quick-start' ? 'examples' : ['api-reference', 'migration', 'troubleshooting'].includes(id) ? 'reference' : 'docs';
        const active = link.dataset.top === top;
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
      const firstRender = currentPageId === null;
      currentPageId = id;
      closeMenu();
      if (!firstRender) $('#main').focus({preventScroll:true});
    }
    if (section) {
      const target = all('.doc-section', article).find(element => element.dataset.sectionId === section);
      if (target && article.contains(target)) requestAnimationFrame(() => target.scrollIntoView({behavior:pageChanged || reducedMotion.matches ? 'instant' : 'smooth',block:'start'}));
      else if (pageChanged) window.scrollTo(0,0);
    } else if (pageChanged) window.scrollTo(0,0);
    requestOutlineUpdate();
  }
  window.addEventListener('hashchange', render);
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('#main').focus();
    $('#main').scrollIntoView({block:'start'});
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (link && link.hash === location.hash) { event.preventDefault(); render(); }
  });
  $('#copy-page-link').addEventListener('click', async () => {
    const ok = await copyText(location.href);
    showToast(ok ? 'Page link copied' : 'Copy is unavailable. Copy the address from your browser.');
    $('#copy-page-link').focus({preventScroll:true});
  });

  function plainText(html) {
    const template = document.createElement('template');
    template.innerHTML = (html || '').replace(/<\/(?:p|div|li|td|th|tr|h[1-6])>|<br\s*\/?\s*>/gi, '$& ');
    return template.content.textContent.replace(/\s+/g, ' ').trim();
  }
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const searchIndex = pages.flatMap(page => [
    {title:page.title,category:page.category,description:page.description,href:route(page.id)},
    ...page.sections.map(section => ({title:section.title,category:page.navTitle || page.title,description:plainText(section.html),href:route(page.id,section.id)}))
  ]).map(item => ({...item,searchText:normalize(`${item.title} ${item.category} ${item.description}`)}));

  function selectSearchResult(index, scroll = false) {
    const links = all('.search-result');
    selectedResult = Math.max(0, Math.min(index, links.length - 1));
    links.forEach((link,i) => link.classList.toggle('is-selected', i === selectedResult));
    if (scroll) links[selectedResult]?.scrollIntoView({block:'nearest'});
  }
  function renderSearch() {
    const query = normalize(searchInput.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    const found = terms.length ? searchIndex.filter(item => terms.every(term => item.searchText.includes(term))).map(item => ({...item,score:terms.reduce((score,term)=>score + (normalize(item.title).includes(term) ? 10 : 0) + (normalize(item.category).includes(term) ? 3 : 0),0)})).sort((a,b)=>b.score-a.score) : searchIndex.filter(item=>!item.href.includes('?'));
    results = found.slice(0,12);
    $('#search-status').textContent = query ? `${found.length} ${found.length===1?'result':'results'}${found.length>12?' · showing the first 12':''}` : 'Browse documentation';
    $('#search-results').innerHTML = results.length ? results.map((item,i)=>`<a class="search-result block rounded-[5px] border border-transparent px-3 py-[11px] hover:border-line hover:bg-surface [&.is-selected]:border-line [&.is-selected]:bg-surface [&_p]:mt-1 [&_p]:line-clamp-2 [&_p]:text-[12px] [&_p]:text-muted ${i===0?' is-selected':''}" href="${escape(item.href)}"><div class="search-result-title flex justify-between gap-2.5 text-[14px] text-foreground"><span>${escape(item.title)}</span><span class="search-result-category text-[10px] text-subtle max-[680px]:hidden">${escape(item.category)}</span></div><p>${escape(item.description.slice(0,220))}</p></a>`).join('') : '<div class="search-results-empty px-5 py-[35px] text-[13px] text-muted">No matching pages. Try a command, setting, or topic name.</div>';
    selectedResult = 0;
  }
  function openSearch(opener) {
    if (searchDialog.open) return;
    const fromDrawer = $('#sidebar').classList.contains('is-open');
    const previousFocus = opener || document.activeElement;
    closeMenu();
    lastSearchOpener = fromDrawer ? $('.menu-toggle') : previousFocus;
    searchInput.value = '';
    renderSearch();
    searchDialog.showModal();
    searchInput.focus();
  }
  all('[data-open-search]').forEach(button=>button.addEventListener('click',()=>openSearch(button)));
  searchInput.addEventListener('input',renderSearch);
  searchDialog.addEventListener('close',()=>{ if (lastSearchOpener?.isConnected) lastSearchOpener.focus({preventScroll:true}); });
  searchDialog.addEventListener('click',event=>{
    if (event.target.closest('.search-result')) { searchDialog.close(); }
    else if (event.target===searchDialog) { const rect=searchDialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) searchDialog.close(); }
  });
  searchDialog.addEventListener('keydown',event=>{
    if (event.key === 'Escape') {
      event.preventDefault();
      searchDialog.close();
    }
    else if (['ArrowDown','ArrowUp'].includes(event.key)) {
      event.preventDefault();
      const links = all('.search-result');
      const focused = links.indexOf(document.activeElement);
      const next = focused < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1) : focused + (event.key === 'ArrowDown' ? 1 : -1);
      selectSearchResult(next, true);
      links[selectedResult]?.focus({preventScroll:true});
    }
    else if (event.key==='Enter' && event.target===searchInput) {
      event.preventDefault();
      if(results[selectedResult]) { location.hash=results[selectedResult].href; searchDialog.close(); render(); }
    }
  });
  document.addEventListener('keydown',event=>{
    if (event.key === 'Tab' && $('#sidebar').classList.contains('is-open')) {
      const focusable = [$('.menu-toggle'), ...all('a, button', $('#sidebar'))];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === focusable.length - 1)) { event.preventDefault(); focusable[0].focus(); }
    }
    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
    if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k') { event.preventDefault(); openSearch(); }
    else if (event.key==='/'&&!editing&&!searchDialog.open) { event.preventDefault(); openSearch(); }
    else if (event.key==='Escape'&&$('#sidebar').classList.contains('is-open')) closeMenu(true);
  });
  render();
})();
