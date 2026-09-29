/* Native math.js expressions, evaluated only in a disposable worker.
 * Convert library objects to plain display data before crossing the worker boundary.
 * Preview limits affect output only, never the values used in calculations.
 */
(function(scope) {
 'use strict';
 const MAX_TEXT=2000,MAX_SIDE=32,MAX_RESULTS=100;
 // plot() is a small course extension, not a math.js built-in. Only data
 // created here becomes a chart; arbitrary objects remain literal text.
 function plotting(math,plots) {
  const array=v=>math.isMatrix(v)?v.toArray():v;
  const label=v=>typeof v==='string'?v.slice(0,80):'';
  function vector(v) {
   v=array(v);
   if(!Array.isArray(v)||!v.length||v.length>1000||v.some(n=>typeof n!=='number'&&n!==null))
    throw Error('plot(): use numeric vectors of 1–1,000 points.');
   return v;
  }
  return function plot(a,b,c) {
   const multiple=arguments.length<=2&&Array.isArray(array(a))&&array(a)[0]?.x!==undefined;
   const options=(multiple?b:c)||{};
   const input=multiple?array(a):[{x:a,y:b,label:options.label,style:options.style}];
   if(input.length>6)throw Error('plot(): use at most six series.');
   let missing=0,finite=0;
   const series=input.map((s,i)=>{
    const x=vector(s.x),y=vector(s.y),style=s.style||'line';
    if(x.length!==y.length)throw Error('plot(): x and y must have the same number of points.');
    if(!['line','points','bar'].includes(style))throw Error('plot(): style must be line, points, or bar.');
    const points=x.map((v,j)=>{
     if(v===null||!Number.isFinite(v))throw Error('plot(): x coordinates must be finite numbers.');
     if(Math.abs(v)>1e100||Number.isFinite(y[j])&&Math.abs(y[j])>1e100)throw Error('plot(): coordinates must be between -1e100 and 1e100.');
     if(y[j]===null||!Number.isFinite(y[j])){missing++;return [v,null];}
     finite++;return [v,y[j]];
    });
    return {label:label(s.label)||'Series '+(i+1),style,points};
   });
   if(!finite)throw Error('plot(): include at least one finite y value.');
   const token=Object.freeze({plot:true});
   plots.set(token,{kind:'plot',series,xLabel:label(options.xLabel)||'x',yLabel:label(options.yLabel)||'y',equal:options.equal===true,note:missing?'Undefined values are left as gaps.':''});
   return token;
  };
 }
 function display(value,math) {
  const format=v=>math.format(v,{truncate:MAX_TEXT+1});
  const matrix=math.isMatrix(value),array=Array.isArray(value);
  let size;
  if(matrix)size=value.size();
  else if(array) {
   if(value.every(v=>!Array.isArray(v)))size=[value.length];
   else if(value.length&&value.every(r=>Array.isArray(r)&&r.length===value[0].length&&r.every(v=>!Array.isArray(v))))size=[value.length,value[0].length];
  }
  if(size?.length>=1&&size.length<=2&&size.every(n=>n>0)) {
   const height=size[0],width=size[1]??1,rows=[];
   let shortened=false;
   for(let i=0;i<Math.min(height,MAX_SIDE);i++) {
    const row=[];
    for(let j=0;j<Math.min(width,MAX_SIDE);j++) {
     const cell=matrix?value.get(size.length===1?[i]:[i,j]):size.length===1?value[i]:value[i][j];
     const text=format(cell);shortened ||= text.length>MAX_TEXT;
     row.push(text.length>MAX_TEXT?text.slice(0,MAX_TEXT)+'…':text);
    }
    rows.push(row);
   }
   const notes=[];
   if(height>MAX_SIDE||width>MAX_SIDE)notes.push(`Showing ${rows.length} × ${rows[0].length} of ${height} × ${width} entries.`);
   if(shortened)notes.push('Long entries shortened.');
   return {kind:'matrix',rows,note:notes.join(' ')};
  }
  const text=format(value);
  return {kind:'text',text:text.length>MAX_TEXT?text.slice(0,MAX_TEXT)+'…':text,note:text.length>MAX_TEXT?'Output shortened.':''};
 }
 function evaluate(source,math) {
  // Use the library's parser and normal language semantics, including visible
  // assignments, custom functions, indexing, units, and semicolon suppression.
  const plots=new WeakMap(),environment=new Map();
  environment.set('plot',plotting(math,plots));
  const value=math.evaluate(source,environment);
  const values=math.isResultSet(value)?value.entries:[value];
  let plotCount=0;
  const results=values.slice(0,MAX_RESULTS).map(v=>{
   const chart=v&&typeof v==='object'?plots.get(v):null;
   if(chart&&++plotCount>6)throw Error('Show at most six plots per calculation.');
   return chart||display(v,math);
  });
  if(values.length>MAX_RESULTS)results.push({kind:'text',text:`Showing the first ${MAX_RESULTS} of ${values.length} outputs.`,note:''});
  return {results};
 }
 scope.math2aiPlaygroundEvaluate=evaluate;
})(typeof self==='object'?self:globalThis);
