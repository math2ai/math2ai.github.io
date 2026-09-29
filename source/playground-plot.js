/* Responsive SVG output for the course's plot() helper. No HTML from code. */
(() => {
 'use strict';
 const colors=['#146b8c','#b04f20','#6651a3','#267348','#aa3571','#555'];
 const W=360,H=256,L=58,R=14,T=16,B=54,PW=W-L-R,PH=H-T-B;
 const format=n=>n===0?'0':Number(n.toPrecision(3)).toString();
 function extent(values,zero=false) {
  let lo=Math.min(...values),hi=Math.max(...values);
  if(zero){lo=Math.min(0,lo);hi=Math.max(0,hi);}
  if(zero&&lo===0&&hi===0)return [0,1];
  const pad=(hi-lo||Math.max(1,Math.abs(lo)))*.08;
  return [zero&&lo===0?0:lo-pad,zero&&hi===0?0:hi+pad];
 }
 function ticks(lo,hi) {
  const rough=(hi-lo)/4,power=10**Math.floor(Math.log10(rough));
  const step=[1,2,5,10].find(n=>n*power>=rough)*power;
  if(!Number.isFinite(step)||step<=0)return [lo,hi];
  const values=[];
  for(let i=Math.ceil(lo/step);i<=Math.floor(hi/step)&&values.length<8;i++)values.push(i*step);
  return values;
 }
 function render(entry,parent) {
  const frame=document.createElement('span');frame.className='explore-chart';parent.append(frame);
  function svgNode(tag,attrs,host,content) {
   const n=document.createElementNS('http://www.w3.org/2000/svg',tag);
   for(const [key,value]of Object.entries(attrs))n.setAttribute(key,String(value));
   if(content!==undefined)n.textContent=content;
   host.append(n);return n;
  }
  const all=entry.series.flatMap(s=>s.points.filter(p=>p[1]!==null));
  let [xmin,xmax]=extent(all.map(p=>p[0]));
  let [ymin,ymax]=extent(all.map(p=>p[1]),entry.series.some(s=>s.style==='bar'));
  if(entry.equal) {
   const unit=Math.max((xmax-xmin)/PW,(ymax-ymin)/PH),cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;
   xmin=cx-unit*PW/2;xmax=cx+unit*PW/2;ymin=cy-unit*PH/2;ymax=cy+unit*PH/2;
  }
  const px=x=>L+(x-xmin)/(xmax-xmin)*PW,py=y=>T+PH-(y-ymin)/(ymax-ymin)*PH;
  const svg=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':`${entry.yLabel} versus ${entry.xLabel}. ${entry.series.map(s=>s.label).join('; ')}.`,focusable:'false'},frame);
  svgNode('title',{},svg,`${entry.yLabel} versus ${entry.xLabel}`);
  svgNode('desc',{},svg,entry.series.map(s=>`${s.label}: ${s.points.length} points. `+
   (s.points.length<=12?s.points.map(p=>`(${p[0]}, ${p[1]??'undefined'})`).join(', '):
    `First (${s.points[0].join(', ')}); last (${s.points.at(-1).join(', ')}).`)).join(' '));
  const discrete=entry.series.every(s=>s.style==='bar'),locations=[...new Set(all.map(p=>p[0]))].sort((a,b)=>a-b);
  const xticks=discrete&&locations.length<=6?locations:ticks(xmin,xmax);
  for(const x of xticks) {
   svgNode('line',{x1:px(x),x2:px(x),y1:T,y2:T+PH,stroke:'#e5e5e5'},svg);
   svgNode('text',{x:px(x),y:T+PH+19,'text-anchor':'middle',class:'plot-tick'},svg,format(x));
  }
  for(const y of ticks(ymin,ymax)) {
   svgNode('line',{x1:L,x2:L+PW,y1:py(y),y2:py(y),stroke:'#e5e5e5'},svg);
   svgNode('text',{x:L-8,y:py(y)+4,'text-anchor':'end',class:'plot-tick'},svg,format(y));
  }
  if(xmin<=0&&xmax>=0)svgNode('line',{x1:px(0),x2:px(0),y1:T,y2:T+PH,stroke:'#999'},svg);
  if(ymin<=0&&ymax>=0)svgNode('line',{x1:L,x2:L+PW,y1:py(0),y2:py(0),stroke:'#999'},svg);
  entry.series.forEach((s,i)=>{
   const color=colors[i];
   if(s.style==='line') {
    let path='',move=true;
    for(const [x,y]of s.points){if(y===null){move=true;continue;}path+=(move?'M':'L')+px(x)+' '+py(y)+' ';move=false;}
    svgNode('path',{d:path,fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':i%3===1?'6 3':i%3===2?'2 3':'none'},svg);
   }
   // Bars are slender stems from zero: they represent discrete outcomes and
   // do not imply a continuous histogram interval or misstate a density.
   for(const [x,y]of s.points) {
    if(y===null)continue;
    if(s.style==='bar')svgNode('line',{x1:px(x),x2:px(x),y1:py(0),y2:py(y),stroke:color,'stroke-width':7},svg);
    if(s.style!=='line'||s.points.length<=12) {
     const mark=svgNode(i%2?'rect':'circle',i%2?{x:px(x)-3,y:py(y)-3,width:6,height:6,fill:color}:{cx:px(x),cy:py(y),r:3.3,fill:color},svg);
     svgNode('title',{},mark,`${s.label}: (${Number(x.toPrecision(6))}, ${Number(y.toPrecision(6))})`);
    }
   }
  });
  svgNode('text',{x:L+PW/2,y:H-8,'text-anchor':'middle',class:'plot-axis-label'},svg,entry.xLabel);
  svgNode('text',{x:14,y:T+PH/2,transform:`rotate(-90 14 ${T+PH/2})`,'text-anchor':'middle',class:'plot-axis-label'},svg,entry.yLabel);
  const legend=document.createElement('span');legend.className='explore-chart-legend';frame.append(legend);
  entry.series.forEach((s,i)=>{
   const item=document.createElement('span'),key=document.createElement('span');
   key.textContent=s.style==='points'?(i%2?'■':'●'):i%3===1?'┄':i%3===2?'┈':'━';key.style.color=colors[i];key.setAttribute('aria-hidden','true');
   item.append(key,document.createTextNode(' '+s.label));legend.append(item);
  });
 }
 window.math2aiRenderPlot=render;
})();
