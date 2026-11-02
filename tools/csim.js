// usage: node csim.js <dir> '<cfg json>' <games> [players csv]
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const cfg=JSON.parse(process.argv[3]||'{}'),G=+process.argv[4]||60,PS=(process.argv[5]||'2,3,4,5,6').split(',').map(Number);
const med=a=>{a=a.slice().sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2},avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
for(const n of PS){const W=[],g12=[],spread=[],wk=[],sr=[],sys=[],unf=[],left=[],pr=[],hy=[],rec=[],cr=[],cv=[],gold=[];const gp={};let stuck=0;
 for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+i,bot:true});
  const S=E.newGame(seats,{seed:s,config:Object.assign({varC:1},cfg)});const r=B.run(S,40000);if(r&&r.stuck){stuck++;if(stuck<3)console.log('STUCK',JSON.stringify(r).slice(0,300));continue}
  const sc=(S.scores||E.score(S)).map(x=>x.total).sort((a,b)=>b-a);W.push(sc[0]);g12.push(sc[0]-sc[1]);spread.push(sc[0]-sc[n-1]);
  S.players.forEach(p=>{wk.push(p.workers.length);sr.push(p.workers.filter(w=>w.lvl==="Sr").length);sys.push(p.systems.length);unf.push((p.building||[]).length);left.push(p.ideas+p.code+p.process+p.buzz);pr.push(p.prod);hy.push(p.hype);rec.push(p.cs.recruits||0);cr.push(p.cs.crunched||0);cv.push(p.cs.converted||0);gold.push(p.gold)});
  (S.gates||[]).forEach(g=>{const k=g.name;gp[g.phase]=gp[g.phase]||[0,0];gp[g.phase][0]+=g.passed.length;gp[g.phase][1]+=g.passed.length+g.failed.length})}
 console.log(n+'P win',med(W).toFixed(0),'gap',med(g12).toFixed(1),'spread',med(spread).toFixed(1),'| wk',avg(wk).toFixed(1),'sr',avg(sr).toFixed(1),'sys',avg(sys).toFixed(1),'unf',avg(unf).toFixed(2),'left',avg(left).toFixed(1),'prod',avg(pr).toFixed(0),'hype',avg(hy).toFixed(0),'rec',avg(rec).toFixed(1),'crunch',avg(cr).toFixed(1),'conv',avg(cv).toFixed(1),'gold',avg(gold).toFixed(0),'| gates',Object.keys(gp).map(k=>Math.round(100*gp[k][0]/gp[k][1])+'%').join('/'),stuck?'stuck '+stuck:'')}
