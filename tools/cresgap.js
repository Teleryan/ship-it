const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');const G=+process.argv[3]||200;
const q=(a,p)=>{a=a.slice().sort((x,y)=>x-y);const i=(a.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return a[l]+(a[h]-a[l])*(i-l)};
for(const N of [2,3,4,5,6]){const ratio=[],sysd=[],bankMax=[],cnt={r15:0,r2:0},earnedAll=[];let n=0;
 for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
  const S=E.newGame(seats,{seed:900000+s,config:{varC:1}});const prev=S.players.map(p=>p.ideas+p.code+p.process+p.buzz),ea=S.players.map(()=>0);let k=0,pk=0;
  while(!S.over&&k++<60000){const pi=E.currentActor(S);if(pi<0)break;const r=B.step(S);if(!r.ok)break;S.players.forEach((p,i)=>{const t=p.ideas+p.code+p.process+p.buzz;if(t>prev[i])ea[i]+=t-prev[i];prev[i]=t;if(t>pk)pk=t})}
  if(!S.over)continue;n++;const mx=Math.max(...ea),mn=Math.min(...ea);ratio.push(mx/Math.max(1,mn));earnedAll.push(...ea);
  const sy=S.players.map(p=>p.systems.length);sysd.push(Math.max(...sy)-Math.min(...sy));if(mx/Math.max(1,mn)>=1.5)cnt.r15++;if(mx/Math.max(1,mn)>=2)cnt.r2++;bankMax.push(pk)}
 console.log(N+'P earned top/bottom ratio median',q(ratio,.5).toFixed(2),'p90',q(ratio,.9).toFixed(2),'| games top>=1.5x bottom',(cnt.r15/n*100).toFixed(0)+'%','>=2x',(cnt.r2/n*100).toFixed(0)+'%','| earned p10-p90',q(earnedAll,.1).toFixed(0)+'-'+q(earnedAll,.9).toFixed(0),'| systems spread (max-min) median',q(sysd,.5),'| peak bank any player median',q(bankMax,.5))}
