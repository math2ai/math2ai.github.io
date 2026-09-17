// Build-time typesetting only. The KaTeX JavaScript library is never shipped to a browser.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const vendor = path.join(root, 'vendor/katex-0.18.7');
const require = createRequire(import.meta.url);
const matrixPattern = /\[\s*\[[^\[\]\n]*\](?:\s*,\s*\[[^\[\]\n]*\])*\s*\]/g;

export function parseMatrix(text) {
 const matches = [...text.matchAll(matrixPattern)];
 if (matches.length !== 1 || matches[0][0] !== text) return null;
 const rows = [...text.slice(1,-1).matchAll(/\[([^\[\]]*)\]/g)].map(m => m[1].trim() ? m[1].split(',').map(x => x.trim()) : []);
 // Do not interpret prose, commands, arbitrary code, or malformed expressions as matrix cells.
 if (!rows.length || rows.some(row => row.some(x => !/^[+−-]?\d+(?:\.\d+)?(?:\s*[+−×*/-]\s*[+−-]?\d+(?:\.\d+)?)*$/.test(x)))) return null;
 return {rows, rectangular: rows[0].length > 0 && rows.every(row => row.length === rows[0].length)};
}

export function matrixTex(matrix, rowLists = false) {
 const cell = text => text.replaceAll('−','-').replaceAll('×',String.raw`\times `).replaceAll('*',String.raw`\times `);
 if (rowLists || !matrix.rectangular) {
  // Preserve unequal and empty rows without silently padding them into a matrix.
  return String.raw`\left[\begin{array}{l}` + matrix.rows.map(row => String.raw`\left[` + row.map(cell).join(String.raw`,\,`) + String.raw`\right]`).join(String.raw`\\`) + String.raw`\end{array}\right]`;
 }
 return String.raw`\begin{bmatrix}` + matrix.rows.map(row => row.map(cell).join(' & ')).join(String.raw`\\`) + String.raw`\end{bmatrix}`;
}

export function bundleStyles() {
 const manifest = JSON.parse(fs.readFileSync(path.join(vendor,'manifest.json'),'utf8'));
 for (const [name, expected] of Object.entries(manifest.sha256)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(vendor,name))).digest('hex');
  if (actual !== expected) throw new Error(`KaTeX asset integrity mismatch: ${name}`);
 }
 const fonts = [];
 let css = fs.readFileSync(path.join(vendor,'katex.min.css'),'utf8');
 css = css.replace(/@font-face\{([^}]+)\}/g, (_all, body) => {
  const filename = body.match(/url\((?:["'])?(fonts\/[^)"']+\.woff2)(?:["'])?\)/)?.[1];
  if (!filename) throw new Error('Missing bundled WOFF2 font');
  const family = body.match(/font-family:([^;]+)/)[1].replace(/["']/g,'');
  const style = body.match(/font-style:([^;]+)/)?.[1] || 'normal';
  const weight = body.match(/font-weight:([^;]+)/)?.[1] || 'normal';
  fonts.push(`${style} ${weight} 20px ${family}`);
  const bytes = fs.readFileSync(path.join(vendor, filename)).toString('base64');
  return '@font-face{' + body.replace(/src:[^;}]*/, `src:url(data:font/woff2;base64,${bytes}) format("woff2")`) + '}';
 });
 if (/url\((?!data:)/.test(css)) throw new Error('Math CSS contains an external dependency');
 return {css, fonts};
}

export function buildMath(course) {
 const {css, fonts} = bundleStyles();
 const katex = require(path.join(vendor, 'katex.js')); // Load only after integrity verification.
 const data = {version:1, katexVersion:katex.version, fonts, fragments:[], fields:{}};
 const cache = new Map();
 function add(key, text, rowLists = false) {
  const parts = []; let end = 0;
  for (const match of text.matchAll(matrixPattern)) {
   const matrix = parseMatrix(match[0]);
   if (!matrix) continue; // Original notation remains readable for unsupported input.
   const style = rowLists || !matrix.rectangular;
   const cacheKey = JSON.stringify([match[0],style]);
   let index = cache.get(cacheKey);
   if (index === undefined) {
    const tex = matrixTex(matrix, style);
    const markup = katex.renderToString(tex, {output:'htmlAndMathml', displayMode:false, throwOnError:true, strict:'error', trust:false, maxExpand:1000});
    index = data.fragments.length;
    data.fragments.push({plain:match[0], tex, rows:matrix.rows, rowLists:style, html:markup});
    cache.set(cacheKey,index);
   }
   parts.push(text.slice(end,match.index), index);
   end = match.index + match[0].length;
  }
  if (end) {
   parts.push(text.slice(end));
   data.fields[key] = {text, parts};
  }
 }
 for (const concept of course.concepts) {
  for (const field of ['definition','formula','formulaNote','example','metaphor']) add(`c:${concept.legacyId}:${field}`,concept[field] ?? "");
  for (const q of concept.questions) {
   for (const field of ['question','feedback','retryFeedback']) add(`q:${q.id}:${field}`,q[field]);
   // All four choices in a rectangularity question share one notation style.
   // Typography itself must not identify the correct option.
   const rowLists = q.options.some(option => [...option.matchAll(matrixPattern)].some(m => parseMatrix(m[0])?.rectangular === false));
   q.options.forEach((option,i) => add(`q:${q.id}:option:${i}`,option,rowLists));
  }
 }
 return {css, data};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const course = JSON.parse(fs.readFileSync(path.join(root,'dist/curriculum.json'),'utf8'));
 process.stdout.write(JSON.stringify(buildMath(course)));
}
