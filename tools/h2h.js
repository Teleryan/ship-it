// usage: node h2h.js dir profileA profileB games players  -> win share and mean VP of A vs B seats (alternating seats)
const [,,dir,A,Bp,Gs,Ns,OV]=process.argv;global.window=undefined;const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');if(OV)Object.assign(B.profiles[A],JSON.parse(OV));
const G=+Gs||100,n=+Ns||4;let wa=0,tot=0,va=[],vb=[];
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+i,bot:true});
 const S=E.newGame(seats,{seed:s*7+1,config:{varC:1}});const isA=i=>((i+s)%2===0);S.players.forEach((p,i)=>{const q=isA(i)?A:Bp;if(q)p.profile=q});
 const r=B.run(S,60000);if(r&&r.stuck)continue;const sc=(S.scores||E.score(S)).map(x=>x.total);
 let best=0;sc.forEach((v,i)=>{if(v>sc[best])best=i;(isA(i)?va:vb).push(v)});if(isA(best))wa++;tot++}
const m=a=>a.reduce((x,y)=>x+y,0)/a.length;
console.log(`${A||'standard'} vs ${Bp||'standard'} @${n}P: ${A||'std'} wins ${Math.round(wa/tot*100)}% of ${tot} games (fair ${Math.round(100*Math.ceil(n/2)/n)}%) meanVP ${m(va).toFixed(1)} vs ${m(vb).toFixed(1)}`);
