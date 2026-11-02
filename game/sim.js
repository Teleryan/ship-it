global.window=undefined;
const D=require('./data.js');const E=require('./engine.js');const B=require('./bot.js');
function run(n,seed){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+(i+1),bot:true});const S=E.newGame(seats,{seed});B.run(S,20000);return S;}
const S=run(4,7);
console.log(S.over,S.round,S.winner);
console.log(S.log.slice(0,45).map(l=>l.r+': '+l.m).join('\n'));
console.log('...');
console.log(JSON.stringify(S.scores.map(s=>[s.name,s.total,s.parts]),null,0).slice(0,1500));
S.players.forEach(p=>console.log(p.name,'gold',p.gold,'prod',p.prod,'mktg',p.mktg,'hype',p.hype,'debt',p.debt,'cul',p.culture,'sys',p.systems.length,'workers',p.workers.length,'miles claimed',p.claimed.length));
// aggregate
let agg={};let N=0;let win={};let rounds=0;
for(const n of [2,3,4,5,6]){agg[n]={tot:0,g:0,gaps:0,sysB:0,prod:0,mk:0,hy:0,db:0,thr:{CLEAN:0,STANDARD:0,ROUGH:0,BLOCKED:0},vpMile:0};
 for(let s=1;s<=60;s++){const X=run(n,s);const sc=X.scores.map(z=>z.total).sort((a,b)=>b-a);agg[n].g++;agg[n].tot+=sc[0];agg[n].gaps+=sc[0]-sc[sc.length-1];
  X.players.forEach(p=>{agg[n].sysB+=p.systems.length;agg[n].prod+=p.prod;agg[n].mk+=p.mktg;agg[n].hy+=p.hype;agg[n].db+=p.debt;agg[n].vpMile+=p.claimed.length});
  X.scores.forEach(z=>agg[n].thr[z.parts.threshold]++);}
 const a=agg[n],pp=a.g*n;console.log(n+'P  winner avg',(a.tot/a.g).toFixed(1),'gap avg',(a.gaps/a.g).toFixed(1),'sys/p',(a.sysB/pp).toFixed(1),'prod',(a.prod/pp).toFixed(1),'mktg',(a.mk/pp).toFixed(1),'hype',(a.hy/pp).toFixed(1),'debt',(a.db/pp).toFixed(1),'miles',(a.vpMile/pp).toFixed(1),JSON.stringify(a.thr));}
