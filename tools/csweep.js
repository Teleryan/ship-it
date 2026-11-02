// full sweep: node csweep.js <dir> <games> <mode neutral|mixed>  -> markdown tables
const dir=process.argv[2]; global.window=undefined;
const E=require(dir+'/engine.js'),B=require(dir+'/bot.js');
const G=+process.argv[3]||300,mode=process.argv[4]||'neutral';
const PERS=[undefined,'crunch','hype','systems','clean'];
const q=(a,p)=>{a=a.slice().sort((x,y)=>x-y);const i=(a.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return a[l]+(a[h]-a[l])*(i-l)};
const avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const f=(x,d=1)=>x.toFixed(d);
const out=[];
for(const N of [2,3,4,5,6]){
  const win=[],all=[],gap=[],spread=[],last=[];const earned=[],spentB=[],conv=[],left=[],bank=Array.from({length:12},()=>[]),gold=[],sys=[],wk=[];let stuck=0,n=0;
  for(let s=1;s<=G;s++){
    const seats=[];for(let i=0;i<N;i++)seats.push({name:'P'+i,bot:true});
    const S=E.newGame(seats,{seed:900000+s,config:{varC:1}});
    if(mode==='mixed')S.players.forEach((p,i)=>{p.persona=PERS[(i+s)%5]});
    let lr=0,k=0;const prev=S.players.map(p=>p.ideas+p.code+p.process+p.buzz),ea=S.players.map(()=>0),sp=S.players.map(()=>0);
    while(!S.over&&k++<60000){const pi=E.currentActor(S);if(pi<0)break;
      if(S.round!==lr&&S.step==='draft'||S.round!==lr&&S.step==='place'){lr=S.round;if(S.round>=1&&S.round<=12)S.players.forEach(p=>bank[S.round-1].push(p.ideas+p.code+p.process+p.buzz))}
      const r=B.step(S);if(!r.ok){stuck++;break}S.players.forEach((p,i)=>{const t=p.ideas+p.code+p.process+p.buzz,d=t-prev[i];if(d>0)ea[i]+=d;else sp[i]-=d;prev[i]=t})}
    if(!S.over)continue;
    const sc=(S.scores||E.score(S)).map(x=>x.total).sort((a,b)=>b-a);
    win.push(sc[0]);sc.forEach(x=>all.push(x));gap.push(sc[0]-sc[1]);spread.push(sc[0]-sc[N-1]);last.push(sc[N-1]);n++;
    S.players.forEach((p,i)=>{const l=p.ideas+p.code+p.process+p.buzz,cv=(p.rs.converted||0);left.push(l);spentB.push(sp[i]-cv);conv.push(cv);earned.push(ea[i]);gold.push(p.gold);sys.push(p.systems.length);wk.push(p.workers.length)});
  }
  out.push({N,n,stuck,win,all,gap,spread,last,earned,spentB,conv,left,bank,gold,sys,wk});
}
const md=[];
md.push(`### Mode: ${mode}, ${G} games per player count\n`);
md.push('**VP range and gaps**\n');
md.push('| Players | Games | Winner median | Winner mean | Winner p10-p90 | Winner min-max | In 100-140 | All players median | All p10-p90 | Last place median | 1st-2nd gap median | Gap mean | Gap p90 | Gap < 5 | Winner-last spread median |');
md.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
out.forEach(o=>{const inR=o.win.filter(x=>x>=100&&x<=140).length/o.n;const lt5=o.gap.filter(x=>x<5).length/o.n;
 md.push(`| ${o.N} | ${o.n} | ${f(q(o.win,.5),0)} | ${f(avg(o.win))} | ${f(q(o.win,.1),0)}-${f(q(o.win,.9),0)} | ${Math.min(...o.win)}-${Math.max(...o.win)} | ${f(inR*100,0)}% | ${f(q(o.all,.5),0)} | ${f(q(o.all,.1),0)}-${f(q(o.all,.9),0)} | ${f(q(o.last,.5),0)} | ${f(q(o.gap,.5))} | ${f(avg(o.gap))} | ${f(q(o.gap,.9))} | ${f(lt5*100,0)}% | ${f(q(o.spread,.5))} |`)});
md.push('\n**Resource tightness (per player, whole game)**\n');
md.push('| Players | Resources earned | Spent on systems and other | Converted in final round | Left unspent | Used (spent+converted) | Systems built | Workers | Gold at end |');
md.push('|---|---|---|---|---|---|---|---|---|');
out.forEach(o=>{const used=avg(o.spentB)+avg(o.conv);md.push(`| ${o.N} | ${f(avg(o.earned))} | ${f(avg(o.spentB))} | ${f(avg(o.conv))} | ${f(avg(o.left))} | ${f(used/avg(o.earned)*100,0)}% | ${f(avg(o.sys))} | ${f(avg(o.wk))} | ${f(avg(o.gold))} |`)});
md.push('\n**Resources banked at the start of each round (average per player)**\n');
md.push('| Players | '+Array.from({length:12},(_,i)=>'R'+(i+1)).join(' | ')+' |');md.push('|---|'+'---|'.repeat(12));
out.forEach(o=>md.push(`| ${o.N} | `+o.bank.map(a=>f(avg(a))).join(' | ')+' |'));
console.log(md.join('\n'));
require('fs').writeFileSync('/tmp/sweep_'+mode+'.md',md.join('\n'));
