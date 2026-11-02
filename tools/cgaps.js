// gap metrics for a config: node cgaps.js <dir> '<cfg json>' <games> [players csv] [mixed]
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const cfg=JSON.parse(process.argv[3]||'{}'),G=+process.argv[4]||200,PS=(process.argv[5]||'2,3,4,5,6').split(',').map(Number),mixed=process.argv[6]==='mixed';const PERS=[undefined,'crunch','hype','systems','clean'];
const q=(a,p)=>{a=a.slice().sort((x,y)=>x-y);const i=(a.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return a[l]+(a[h]-a[l])*(i-l)};
for(const N of PS){const W=[],gap=[],last=[];
 for(let s=1;s<=G;s++){const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
  const S=E.newGame(seats,{seed:900000+s,config:Object.assign({varC:1},cfg)});if(mixed)S.players.forEach((p,i)=>{p.persona=PERS[(i+s)%5]});
  const r=B.run(S,40000);if(r&&r.stuck)continue;const sc=(S.scores||E.score(S)).map(x=>x.total).sort((a,b)=>b-a);W.push(sc[0]);gap.push(sc[0]-sc[1]);last.push(sc[N-1])}
 console.log(N+'P win med',q(W,.5).toFixed(0),'in100-140',(W.filter(x=>x>=100&&x<=140).length/W.length*100).toFixed(0)+'%','| gap med',q(gap,.5).toFixed(1),'p75',q(gap,.75).toFixed(1),'p90',q(gap,.9).toFixed(1),'blowout>=25',(gap.filter(x=>x>=25).length/gap.length*100).toFixed(0)+'%','<5',(gap.filter(x=>x<5).length/gap.length*100).toFixed(0)+'%','| last med',q(last,.5).toFixed(0))}
