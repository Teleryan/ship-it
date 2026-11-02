// what drives the 1st-2nd gap? usage: node cgapsrc.js <dir> <games> <N> [mixed]
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const G=+process.argv[3]||300,N=+process.argv[4]||4,mixed=process.argv[5]==='mixed';const PERS=[undefined,'crunch','hype','systems','clean'];
const keys=['prodShare','raceHype','culture','objectives','synergy','systems','gold','crisis','reach','launch','delivery','vpAdj'];
const rows=[];
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
 const S=E.newGame(seats,{seed:900000+s,config:Object.assign({varC:1},JSON.parse(process.env.CFG||'{}'))});if(mixed)S.players.forEach((p,i)=>{p.persona=PERS[(i+s)%5]});
 const r=B.run(S,40000);if(r&&r.stuck)continue;const sc=(S.scores||E.score(S)).slice().sort((a,b)=>b.total-a.total);
 const w=sc[0],r2=sc[1];const d={gap:w.total-r2.total};
 keys.forEach(k=>{d[k]=((w.parts[k]||0)-(r2.parts[k]||0))});
 const sum=keys.reduce((a,k)=>a+d[k],0);d.other=d.gap-sum; // anything not listed
 d.wGold=S.players[w.id].gold;d.rGold=S.players[r2.id].gold;rows.push(d);}
const avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
rows.sort((a,b)=>a.gap-b.gap);const q=(p)=>rows[Math.floor((rows.length-1)*p)].gap;
const thr=q(.75);const hi=rows.filter(r=>r.gap>=thr),lo=rows.filter(r=>r.gap<thr);
console.log(N+'P'+(mixed?' mixed':'')+' games',rows.length,'gap median',q(.5).toFixed(1),'p75',thr.toFixed(1),'p90',q(.9).toFixed(1),'max',rows[rows.length-1].gap.toFixed(0),' blowouts(>=25):',(rows.filter(r=>r.gap>=25).length/rows.length*100).toFixed(0)+'%');
console.log('source'.padEnd(11),'top-quartile-gap games'.padEnd(24),'other games');
[...keys,'other'].forEach(k=>console.log(k.padEnd(11),avg(hi.map(r=>r[k])).toFixed(1).padEnd(24),avg(lo.map(r=>r[k])).toFixed(1)));
console.log('gap'.padEnd(11),avg(hi.map(r=>r.gap)).toFixed(1).padEnd(24),avg(lo.map(r=>r.gap)).toFixed(1));
