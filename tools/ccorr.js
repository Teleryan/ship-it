const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const G=+process.argv[3]||150,N=+process.argv[4]||4;
const rows=[];
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
 const S=E.newGame(seats,{seed:s,config:{varC:1}});const r=B.run(S,40000);if(r&&r.stuck)continue;
 const sc=(S.scores||E.score(S));const m=sc.reduce((a,x)=>a+x.total,0)/N;
 S.players.forEach((p,i)=>rows.push({vp:sc[i].total-m,g:s,f:{wk:p.workers.length,sr:p.workers.filter(w=>w.lvl==='Sr').length,sys:p.systems.length,rec:p.cs.recruits||0,crunch:p.cs.crunched||0,conv:p.cs.converted||0,gold:p.gold,prod:p.prod,hype:p.hype,left:p.ideas+p.code+p.process+p.buzz,debt:p.debt,cult:p.culture,obj:p.objectives.length,fat:p.workers.reduce((a,w)=>a+w.fat,0)}}));}
const keys=Object.keys(rows[0].f);
// per-game demeaned features
const byG={};rows.forEach(r=>(byG[r.g]=byG[r.g]||[]).push(r));
Object.values(byG).forEach(a=>keys.forEach(k=>{const m=a.reduce((x,r)=>x+r.f[k],0)/a.length;a.forEach(r=>r['d_'+k]=r.f[k]-m)}));
keys.forEach(k=>{let sxy=0,sxx=0,syy=0;rows.forEach(r=>{sxy+=r['d_'+k]*r.vp;sxx+=r['d_'+k]**2;syy+=r.vp**2});console.log(k.padEnd(7),'corr',(sxy/Math.sqrt(sxx*syy)).toFixed(2),'slope VP/unit',(sxy/sxx).toFixed(2),'mean',(rows.reduce((a,r)=>a+r.f[k],0)/rows.length).toFixed(1))});
