const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');const G=+process.argv[3]||200,N=+process.argv[4]||6;
const rows=[];
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
 const S=E.newGame(seats,{seed:900000+s,config:{varC:1}});const prev=S.players.map(p=>p.ideas+p.code+p.process+p.buzz),ea=S.players.map(()=>0),orderSum=S.players.map(()=>0),orders=S.players.map(()=>0);let k=0,lastRound=0;
 while(!S.over&&k++<60000){const pi=E.currentActor(S);if(pi<0)break;
  if(S.round!==lastRound){lastRound=S.round;S.players.forEach((p,i)=>{orderSum[i]+=S.order.indexOf(p.id);orders[i]++})}
  const r=B.step(S);if(!r.ok)break;S.players.forEach((p,i)=>{const t=p.ideas+p.code+p.process+p.buzz;if(t>prev[i])ea[i]+=t-prev[i];prev[i]=t})}
 if(!S.over)continue;const sc=(S.scores||E.score(S)).map(x=>x.total);const m=sc.reduce((a,b)=>a+b,0)/N,me=ea.reduce((a,b)=>a+b,0)/N;
 S.players.forEach((p,i)=>rows.push({e:ea[i]-me,vp:sc[i]-m,ord:orderSum[i]/orders[i],wk:p.workers.length,pl:p.cs.placed||0,sr:p.workers.filter(w=>w.lvl==='Sr').length,rec:p.cs.recruits||0,gold:p.gold,sys:p.systems.length}))}
const corr=(f,g)=>{const mx=rows.reduce((a,r)=>a+f(r),0)/rows.length,my=rows.reduce((a,r)=>a+g(r),0)/rows.length;let sxy=0,sxx=0,syy=0;rows.forEach(r=>{const x=f(r)-mx,y=g(r)-my;sxy+=x*y;sxx+=x*x;syy+=y*y});return (sxy/Math.sqrt(sxx*syy)).toFixed(2)};
console.log(N+'P resource earned (vs game mean): corr with VP',corr(r=>r.e,r=>r.vp),'| with avg turn-order position (0=first)',corr(r=>r.e,r=>r.ord),'| workers',corr(r=>r.e,r=>r.wk),'| Sr',corr(r=>r.e,r=>r.sr),'| recruits',corr(r=>r.e,r=>r.rec),'| systems',corr(r=>r.e,r=>r.sys));
const top=rows.filter(r=>r.e>3),bot=rows.filter(r=>r.e<-3);const a=(x,f)=>(x.reduce((s,r)=>s+f(r),0)/x.length).toFixed(1);
console.log(' rich(+3) n',top.length,'vp',a(top,r=>r.vp),'order',a(top,r=>r.ord),'wk',a(top,r=>r.wk),'| poor(-3) n',bot.length,'vp',a(bot,r=>r.vp),'order',a(bot,r=>r.ord),'wk',a(bot,r=>r.wk));
