global.window=undefined;
const D=require('./data.js');const E=require('./engine.js');const B=require('./bot.js');
for(const n of [2,4,6]){const w=new Array(n).fill(0),sc=new Array(n).fill(0);const G=150;
 for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+(i+1),bot:true});const S=E.newGame(seats,{seed:5000+s});B.run(S,30000);w[S.winner]++;S.scores.forEach(x=>sc[x.id]+=x.total/G);}
 console.log(n+'P win%',w.map(x=>(x/G*100).toFixed(0)).join(' '),' avg VP',sc.map(x=>x.toFixed(0)).join(' '));}
