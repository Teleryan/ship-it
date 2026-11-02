// self-play tuner: candidate params ("cand" persona) vs neutral base in the same games, same seeds.
// usage: node ctune.js <dir> eval '<params json>' [games] [players]   |   node ctune.js <dir> search <rounds> [games]
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
function evalP(params,G,N,seed0){
  B.personas.cand=params;let d=0,w=0,n=0,vc=0;
  for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
    const S=E.newGame(seats,{seed:(seed0||0)+s,config:{varC:1}});
    const off=s%2;S.players.forEach((p,i)=>{if((i+off)%2===0)p.persona='cand'});
    const r=B.run(S,40000);if(r&&r.stuck)continue;
    const sc=(S.scores||E.score(S)).map(x=>x.total);let c=0,cn=0,b=0,bn=0;
    S.players.forEach((p,i)=>{if(p.persona==='cand'){c+=sc[i];cn++}else{b+=sc[i];bn++}});
    d+=c/cn-b/bn;vc+=c/cn;const mx=Math.max(...sc);const wi=sc.indexOf(mx);if(S.players[wi].persona==='cand')w++;n++;}
  return {diff:d/n,win:w/n,vp:vc/n,n};
}
module.exports={evalP};
if(require.main===module){
 const mode=process.argv[3];
 if(mode==='eval'){const P=JSON.parse(process.argv[4]||'{}'),G=+process.argv[5]||200,N=+process.argv[6]||4;const t=Date.now();const r=evalP(P,G,N);console.log(JSON.stringify(r),(Date.now()-t)/1000+'s')}
}
if(require.main===module&&process.argv[3]==='search'){
 const R=+process.argv[4]||40,G=+process.argv[5]||120;
 const space={gate:[0,3,.5],gateSurplus:[.5,1.2,.1],gatePace:[3,10,1],resVal:[.8,2.6,.2],recBase:[2,5,.4],recReserve:[0,5,1],recMax:[-2,3,1],srCap:[.2,1,.1],promoGold:[2,10,1],crunchGold:[6,24,2],crunchRound:[5,12,1],buildScale:[.7,1.6,.1],srVal:[0,3,.4],convHold:[.4,1.6,.2],thr:[0,1.5,.3],prod:[.6,1.6,.1],hype:[.6,1.6,.1],gold:[.5,1.8,.1],spotDebt:[.2,1.4,.2],debt:[.6,2,.2],buildBias:[-2,4,.5]};
 const keys=process.env.KEYS?process.env.KEYS.split(','):Object.keys(space);let best=JSON.parse(process.env.START||'{}');const NEU=process.env.NEUTRALIZE?1:0;const ev=(P,seed)=>{let t=0;for(const N of [3,4,5]){t+=evalP(P,G,N,seed).diff}return t/3};
 let bs=ev(best,1000);console.log('start',bs.toFixed(2),JSON.stringify(best));
 for(let r=0;r<R;r++){const k=keys[Math.floor(Math.random()*keys.length)],[lo,hi,st]=space[k];
  const cur=best[k]!=null?best[k]:(({gate:1,gateSurplus:1.1,gatePace:4,resVal:1.5,recBase:3.4,recReserve:2,recMax:0,srCap:.5,promoGold:7,crunchGold:16,crunchRound:8,buildScale:1,srVal:1.2,convHold:1,thr:.3,prod:1,hype:1,gold:1,spotDebt:.3,debt:1,buildBias:0})[k]);
  let nv=cur+(Math.random()<.5?-1:1)*st*(1+Math.floor(Math.random()*2));nv=Math.max(lo,Math.min(hi,Math.round(nv*100)/100));if(nv===cur)continue;
  const cand=Object.assign({},best,{[k]:nv});const sc=ev(cand,1000+(r%3)*7919);const base=ev(best,1000+(r%3)*7919);
  const ok=sc>base+1.0;console.log(String(r).padStart(3),k,cur,'->',nv,'cand',sc.toFixed(2),'cur',base.toFixed(2),ok?'ACCEPT':'');
  if(ok){best=cand;console.log('BEST',JSON.stringify(best))}}
 console.log('FINAL',JSON.stringify(best));}
