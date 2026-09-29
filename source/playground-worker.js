'use strict';
// Keep math.js defaults: complex numbers, units, matrices, and all functions
// exposed by its expression parser. Each browser run starts in a fresh worker.
self.onmessage=event=>{
 try { self.postMessage({ok:true,...self.math2aiPlaygroundEvaluate(event.data,math)}); }
 catch(error) { self.postMessage({ok:false,error:String(error.message||'This calculation could not be evaluated.').slice(0,300)}); }
};
