global.window=undefined;
const D=require('./data.js');const E=require('./engine.js');const B=require('./bot.js');
function game(n,seed,cfg){
  const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+(i+1),bot:true});
  const S=E.newGame(seats,{seed,config:cfg});
  const r=B.run(S,20000);
  return {S,r};
}
let fails=0;
for(const n of [2,3,4,5,6]){
  for(let seed=1;seed<=20;seed++){
    let res;
    try{res=game(n,seed);}catch(e){console.log('EXC',n,seed,e.stack.split('\n').slice(0,4).join('|'));fails++;break;}
    if(!res.S.over){console.log('STUCK',n,seed,JSON.stringify(res.r),'step',res.S.step,'round',res.S.round,'dq',JSON.stringify(res.S.dq[0]));fails++;break;}
  }
}
console.log('fails',fails);
