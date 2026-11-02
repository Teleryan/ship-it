global.window=undefined;const dir=process.argv[2]||'/home/claude/shipit';const cfg=JSON.parse(process.argv[3]||'{}');const N=+process.argv[4]||4,G=+process.argv[5]||40;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const use={},avail={};const orig=E.act;let phaseOf=0;
E.act=function(S,a){const ph=S.phase,rd=S.round;const r=orig(S,a);if(r&&r.ok&&a.type==='place'){const k=a.target;use[k]=(use[k]||0)+1;}return r;};
let sg={};
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});const S=E.newGame(seats,{seed:s,config:Object.assign({varC:1},cfg)});B.run(S,40000);
 (S.gates||[]).forEach(g=>{const q=sg[g.name]=sg[g.name]||[0,0];q[0]+=g.passed.length;q[1]+=g.passed.length+g.failed.length});}
const spots=require(dir+'/data.js').spotsC;
const rows=spots.map(sp=>[sp.id,(use['spot:'+sp.id]||0)/G,sp.phases.join('')]).sort((a,b)=>a[1]-b[1]);
console.log('LEAST USED/game:',rows.slice(0,14).map(r=>r[0]+':'+r[1].toFixed(2)).join(' '));
console.log('MOST USED/game:',rows.slice(-8).map(r=>r[0]+':'+r[1].toFixed(2)).join(' '));
console.log('sys triggers/game',((Object.keys(use).filter(k=>k.startsWith('sys:')).reduce((t,k)=>t+use[k],0))/G).toFixed(1));
console.log('GATES',Object.keys(sg).map(k=>k+' '+Math.round(100*sg[k][0]/sg[k][1])+'% (n='+sg[k][1]+')').join(' | '));
