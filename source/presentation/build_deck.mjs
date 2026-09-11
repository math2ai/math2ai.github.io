import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const course=JSON.parse(await fs.readFile(root+'/dist/curriculum.json','utf8'));
const pages=JSON.parse(await fs.readFile(root+'/build/layout.json','utf8'));
const presentation=Presentation.create({slideSize:{width:1122.52,height:793.70}});
for(const p of pages){
 const c=course.concepts[p.id-1],slide=presentation.slides.add();slide.background.fill='#FFFFFF';
 for(const b of p.blocks){
  for(const [j,line] of b.lines.entries()){
   const s=slide.shapes.add({geometry:'textbox',name:'concept-'+p.id+'-'+b.name+'-'+j,position:{left:b.x,top:b.y+j*b.lineHeight-3,width:1004,height:b.lineHeight+3},fill:'none',line:{fill:'none',width:0}});
   s.text=line;s.text.style={fontSize:b.size,typeface:'DejaVu Sans',bold:b.bold,color:b.gray?'#555555':'#111111',alignment:'left',verticalAlignment:'top',autoFit:'none',wrap:'none',insets:{left:0,right:0,top:0,bottom:0}};
  }
 }
 let notes=`Concept ${c.id}: ${c.title}\n\nUnderstanding check\n${c.question}\n${c.options.map((o,i)=>String.fromCharCode(65+i)+'. '+o).join('\n')}\n\nAnswer: ${String.fromCharCode(65+c.correct)}. ${c.options[c.correct]}\n${c.feedback}\n\nNumerical examples are original teaching examples, not project measurements.\n`;
 if(c.id===1)notes+=course.about+'\n'+course.context+'\n'+course.mentor+'\n';
 if(c.title==='Forward-deployed engineering')notes+=course.background+'\n';
 notes+='\n[Sources]\n'+(c.sources.length?c.sources.map(s=>s.title+'\n'+s.url).join('\n\n'):'Standard mathematical definitions or original educational synthesis. Project-specific descriptions, where present, are based on Danny Castonguay’s request and available prior context.')+'\n[/Sources]';
 slide.speakerNotes.textFrame.setText(notes);
}
await fs.mkdir(root+'/build/rendered',{recursive:true});
await fs.writeFile(root+'/build/presentation.json',JSON.stringify(presentation.toProto()));
await (await PresentationFile.exportPptx(presentation)).save(root+'/output/Mathematics-to-Model-Conversations.pptx');
console.log('Exported editable 100-slide PowerPoint.');
for(let i=0;i<100;i++){
 const slide=presentation.slides.items[i];
 const png=await presentation.export({slide,format:'png',scale:1});
 await fs.writeFile(root+`/build/rendered/artifact-${String(i+1).padStart(3,'0')}.png`,new Uint8Array(await png.arrayBuffer()));
}
console.log('Rendered all 100 slides with the presentation renderer.');
