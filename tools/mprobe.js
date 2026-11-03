global.window=undefined;const dir=process.argv[2],G=+process.argv[3]||100,N=+process.argv[4]||4;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');const D=require(dir+'/data.js');
const M=D.milestones,hit=M.map(()=>({games:0,first:[],open:0}));
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
 const S=E.newGame(seats,{seed:s,config:{varC:1}});const seen=M.map(()=>new Set());let lastR=0,g=0;
 while(!S.over&&g++<80000){if(S.step==='milestones'&&S.round!==lastR&&!S.dq.length){lastR=S.round;S.players.forEach(p=>M.forEach((m,i)=>{const f=E.MILE_CHECK[m.name];let ok=false;try{ok=f(S,p)&&(!m.phases||m.phases.includes(S.phase))}catch(e){}
   if(ok&&!seen[i].has(p.id)){seen[i].add(p.id);hit[i].first.push(S.round);hit[i].games++}}))}
  const r=B.step(S);if(!r.ok)break}}
M.forEach((m,i)=>{const h=hit[i],f=h.first.slice().sort((a,b)=>a-b);const med=f.length?f[f.length>>1]:'-';const early=f.filter(x=>x<=2).length;
 console.log(String(i).padStart(2),m.name.padEnd(22),'phases',JSON.stringify(m.phases),'met by',Math.round(h.games/(G*N)*100)+'% of players','median first round',med,'| met in r1-2:',Math.round(early/(G*N)*100)+'%')});
