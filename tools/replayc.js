global.window=undefined;
const D=require('/home/claude/shipit/data.js');const E=require('/home/claude/shipit/engine.js');const B=require('/home/claude/shipit/bot.js');
const pers=['','crunch','hype','systems','clean'];let bad=0,games=0,acts=0;
for(const n of [2,3,4,5,6]) for(let s=1;s<=12;s++){
  const seed=1000*n+s;
  const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+i,bot:true});
  const host=E.newGame(seats,{seed,config:{varC:1}});host.players.forEach((p,i)=>p.persona=pers[(i+s)%5]);
  const log=[];let guard=0;
  while(!host.over&&guard++<20000){const a=B.decide(host);if(!a){console.log('no action');bad++;break;}const s0=host.seed;const r=E.act(host,a);if(!r.ok){console.log('fail',r.error);bad++;break;}log.push({a:JSON.parse(JSON.stringify(a)),s:s0});}
  const rep=E.newGame(seats,{seed,config:{varC:1}});rep.players.forEach((p,i)=>p.persona=pers[(i+s)%5]);
  for(const e of log){rep.seed=e.s;const r=E.act(rep,e.a);if(!r.ok){console.log('replay fail',r.error);bad++;break;}}
  const strip=S=>JSON.stringify(S,(k,v)=>k==='data'?undefined:v);
  if(strip(host)!==strip(rep)){bad++;console.log('DIVERGED',n,s);}
  games++;acts+=log.length;
}
console.log('games',games,'actions',acts,'bad',bad);
