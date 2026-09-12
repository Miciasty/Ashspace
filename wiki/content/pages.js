// Shared article components. Inputs are trusted, locally authored content.
window.WIKI_PAGES = [];
window.WIKI_UI = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return {
    code: (source, filename, language = 'java') => `<div class="code-block my-[21px] overflow-hidden rounded-[7px] border border-line bg-surface print:break-inside-avoid" data-language="${escape(language)}" data-filename="${escape(filename)}"><pre><code>${escape(source.trim())}</code></pre></div>`,
    table: (headers, rows) => `<div class="doc-table my-[22px] overflow-x-auto rounded-[6px] border border-line"><table class="w-full border-collapse text-left text-[12px]"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    note: (title, html) => `<aside class="callout note my-6 grid grid-cols-[18px_minmax(0,1fr)] gap-x-[11px] rounded-[6px] border border-line bg-surface px-[17px] py-4 print:break-inside-avoid"><div><strong>${title}</strong>${html}</div></aside>`,
    cards: items => `<div class="link-cards my-[22px] grid grid-cols-2 gap-[13px] max-[680px]:grid-cols-1">${items.map(i=>`<a class="link-card block rounded-[6px] border border-line p-[18px] [background:linear-gradient(145deg,var(--surface),transparent)] transition-[border-color] duration-150 hover:border-accent" href="#/${i.id}"><span>Read the guide <b>↗</b></span><h3>${i.title}</h3><p>${i.text}</p></a>`).join('')}</div>`
  };
})();
