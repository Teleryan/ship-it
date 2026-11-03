const dir=process.argv[2],prof=process.argv[3]||'',G=+process.argv[4]||150;global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const PERS=[undefined,'crunch','hype','systems','clean'];
const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]},avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
console.log('profile',prof||'standard');
for(const n of [2,3,4,5,6]){const W=[],gap=[],last=[],left=[],sys=[],gold=[];let bl=0,inr=0,stuck=0;
 for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+i,bot:true});
  const S=E.newGame(seats,{seed:s,config:{varC:1}});S.players.forEach((p,i)=>{if(prof)p.profile=prof;const q=PERS[(i+s)%5];if(q)p.persona=q});
  const r=B.run(S,60000);if(r&&r.stuck){stuck++;continue}
  const sc=(S.scores||E.score(S)).map(x=>x.total).sort((a,b)=>b-a);W.push(sc[0]);gap.push(sc[0]-sc[1]);last.push(sc[n-1]);if(sc[0]-sc[1]>=25)bl++;if(sc[0]>=100&&sc[0]<=140)inr++;
  S.players.forEach(p=>{left.push(p.ideas+p.code+p.process+p.buzz);sys.push(p.systems.length);gold.push(p.gold)})}
 const g=W.length;console.log(n+'P win',med(W),'in100-140',Math.round(inr/g*100)+'%','gap',med(gap).toFixed(1),'blow',Math.round(bl/g*100)+'%','last',med(last),'leftRes',avg(left).toFixed(1),'sys',avg(sys).toFixed(1),'gold',avg(gold).toFixed(0),stuck?'STUCK '+stuck:'')}
