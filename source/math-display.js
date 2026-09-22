// Display prebuilt HTML only; no LaTeX parser or typesetter runs on the visitor's device.
(() => {
 'use strict';
 const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data = {}, ready = false;
 try { data = JSON.parse(document.getElementById('math-data')?.textContent || '{}'); } catch {}
 const fonts = Array.isArray(data.fonts) ? data.fonts : [];
 function html(text, key) {
  const entry = data.fields?.[key];
  if (!entry || entry.text !== text || !Array.isArray(entry.parts)) return escape(text);
  try {
   return entry.parts.map(part => {
    if (typeof part === 'string') return escape(part);
    const fragment = Number.isSafeInteger(part) && data.fragments?.[part];
    if (!fragment || typeof fragment.html !== 'string' || typeof fragment.plain !== 'string') throw Error('Missing math fragment');
    return `<span class="math-fragment"><span class="math-fallback"${ready ? ' hidden' : ''}>${escape(fragment.plain)}</span><span class="math-rendered"${ready ? '' : ' hidden'}>${fragment.html}</span></span>`;
   }).join('');
  } catch { return escape(text); }
 }
 function label(text, key) {
  const entry = data.fields?.[key];
  if (!entry || entry.text !== text || !Array.isArray(entry.parts)) return text;
  try {
   return entry.parts.map(part => {
    if (typeof part === 'string') return part;
    const fragment = data.fragments[part];
    if (!fragment || typeof fragment.plain !== 'string') throw Error('Missing math fragment');
    let index=0;
    // Keep spoken matrix rows even when a matrix is embedded in a larger equation.
    return fragment.plain.replace(/\[\s*\[[^\[\]\n]*\](?:\s*,\s*\[[^\[\]\n]*\])*\s*\]/g, original => {
     const matrix=fragment.matrices?.[index++] || (fragment.rows ? fragment : null);
     if(!matrix)return original;
     const rows=matrix.rows;
     const shape=matrix.rowLists?`array with ${rows.length} rows`:`matrix with ${rows.length} rows and ${rows[0].length} columns`;
     return shape+'; '+rows.map((row,i)=>`row ${i+1}: ${row.length?row.join(', '):'empty'}`).join('; ');
    });
   }).join('');
  } catch { return text; }
 }
 function refresh(root = document) {
  for (const fragment of root.querySelectorAll?.('.math-fragment') || []) {
   const fallback = fragment.querySelector('.math-fallback'), rendered = fragment.querySelector('.math-rendered');
   if (!fallback || !rendered) continue;
   fallback.hidden = ready; rendered.hidden = !ready;
   // A wide equation scrolls inside its own container, including by keyboard.
   const scrolls = fragment.scrollWidth > fragment.clientWidth + 1;
   if (scrolls) {
    fragment.setAttribute('tabindex','0');
    fragment.setAttribute('role','group');
    fragment.setAttribute('aria-label','Mathematical notation; scroll horizontally to read');
   } else {
    fragment.removeAttribute('tabindex');
    fragment.removeAttribute('role');
    fragment.removeAttribute('aria-label');
   }
  }
 }
 function write(node, text, key) {
  node.textContent = text;
  const markup = html(text,key);
  if (markup !== escape(text)) node.innerHTML = markup;
  refresh(node);
 }
 window.math2aiMath = {html, label, write, refresh};
 // Plain notation is visible by default, even if fonts or the enhancement fail.
 // Require actual loaded faces: FontFaceSet.load() returns [] if the CSS is missing.
 if (fonts.length && document.fonts?.load) {
  Promise.all(fonts.map(font => document.fonts.load(font))).then(groups => {
   ready = groups.every(group => group.length && group.every(face => face.status === 'loaded'));
   refresh();
  }).catch(() => {});
 }
 window.addEventListener('resize', () => refresh());
})();
