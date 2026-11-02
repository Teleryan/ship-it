// usage: node cdiag.js <dir> <games> <players> [cfg json]  -> win rate by persona + wasted placements, leftover resources
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const G=+process.argv[3]||80,N=+process.argv[4]||4,cfg=JSON.parse(process.argv[5]||'{}');
const P=[undefined,'crunch','hype','systems','clean'];
const win={},seat={},vp={},cnt={};let passes=0,places=0,idle=0,pl=0,lastres=0,lp=0;
for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true,persona:P[(i+s)%5]});
 const S=E.newGame(seats,{seed:s,config:Object.assign({varC:1},cfg)});S.players.forEach((p,i)=>{p.persona=P[(i+s)%5]});const r=B.run(S,40000);if(r&&r.stuck){console.log('STUCK');continue}
 const sc=(S.scores||E.score(S)).map(x=>x.total);const mx=Math.max(...sc);
 S.players.forEach((p,i)=>{const k=p.persona||'neutral';cnt[k]=(cnt[k]||0)+1;vp[k]=(vp[k]||0)+sc[i];if(sc[i]===mx)win[k]=(win[k]||0)+1;
   lastres+=p.ideas+p.code+p.process+p.buzz;lp++;});}
Object.keys(cnt).forEach(k=>console.log(k.padEnd(8),'seats',cnt[k],'win%',((win[k]||0)/cnt[k]*100).toFixed(0)+'% (fair '+(100/N).toFixed(0)+'%)','avgVP',(vp[k]/cnt[k]).toFixed(1)));
console.log('leftover res/player',(lastres/lp).toFixed(1));
