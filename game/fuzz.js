global.window=undefined;
const D=require('./data.js');const E=require('./engine.js');const B=require('./bot.js');
const cnt={};let errs=0;
function R(S,n){return E.rint(S,n)}
function fuzzAct(S){
  const pi=E.currentActor(S);const p=S.players[pi];const d=S.dq[0];
  const tries=[];
  if(d){
    if(d.t==='choose'){const ok=d.options.filter(o=>!o.disabled);tries.push({type:'choose',p:pi,k:ok[R(S,ok.length)].k});}
    else if(d.t==='raidHire'){const dd=E.ShipItEngine;tries.push({type:'raid',p:pi,disc:E.DISCS[R(S,9)],lvl:R(S,2)?'Sr':'Jr'});tries.push({type:'skip',p:pi});}
    else if(d.t==='pivot')tries.push({type:'pivot',p:pi,replace:!!R(S,2)});
    else if(d.t==='swapObjPick'){const a=[d.old].concat(d.opts);tries.push({type:'swapObjPick',p:pi,pick:a[R(S,a.length)]});}
    else if(d.t==='keepMile')tries.push({type:'keepMile',p:pi,keep:[d.opts[R(S,d.opts.length)]]});
    else if(d.t==='bid')tries.push({type:'bid',p:pi,amount:R(S,p.gold+1)});
    else if(d.t==='patch'){tries.push({type:'patchFix',p:pi,idx:R(S,3)});tries.push({type:'patchDone',p:pi});}
    else {const a=B.decide(S);tries.push(a);}
  } else if(S.step==='rest'){
    const kinds=['promote','headhunt','fire','swapObj','swapMile','done','done'];
    const k=kinds[R(S,kinds.length)];
    if(k==='promote'&&p.workers.length)tries.push({type:'promote',p:pi,worker:p.workers[R(S,p.workers.length)].id});
    else if(k==='headhunt'){const t=S.players[R(S,S.players.length)];if(t.workers.length)tries.push({type:'headhunt',p:pi,target:t.id,worker:t.workers[R(S,t.workers.length)].id});}
    else if(k==='fire'&&p.workers.length&&R(S,3)==0)tries.push({type:'fire',p:pi,worker:p.workers[0].id});
    else if(k==='swapObj'&&p.objectives.length)tries.push({type:'swapObj',p:pi,obj:p.objectives[0]});
    else if(k==='swapMile'&&p.miles.length)tries.push({type:'swapMile',p:pi,mile:p.miles[0]});
    tries.push({type:'done',p:pi});
  } else if(S.step==='place'){
    // random legal placement incl. alt/choice/bonus
    const opts=[];p.workers.forEach(w=>E.placementOptions(S,pi,w).forEach(o=>{if(o.ok)opts.push({w,o})}));
    if(opts.length){const x=opts[R(S,opts.length)];const a={type:'place',p:pi,worker:x.w.id,target:x.o.target,as:x.o.as?x.o.as[R(S,x.o.as.length)]:undefined,bonus:R(S,2)?'mktg':'prod',alt:['fixdebt','hype',undefined][R(S,3)],choice:R(S,2)};
      if(x.o.spot&&x.o.spot.special==='mentor'){const jr=p.workers.find(y=>y.lvl==='Jr'&&y.disc===x.w.disc);if(jr)a.jr=jr.id;}tries.push(a);}
    tries.push({type:'pass',p:pi});
  } else tries.push(B.decide(S));
  for(const a of tries){ if(!a)continue; const r=E.act(S,a); if(r.ok)return true; }
  // fallback to bot
  const a=B.decide(S); const r=E.act(S,a); if(!r.ok){ errs++; console.log('STUCK',S.step,JSON.stringify(a),r.error); return false;} return true;
}
for(const n of [2,3,4,5,6]){
 for(let seed=1;seed<=60;seed++){
  const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+(i+1)});
  const S=E.newGame(seats,{seed});let k=0;
  try{ while(!S.over&&k++<20000){ if(!fuzzAct(S))break; } }catch(e){console.log('EXC',n,seed,e.stack.split('\n').slice(0,5).join('|'));errs++;break;}
  if(!S.over){console.log('NOT OVER',n,seed,S.step,S.round,JSON.stringify(S.dq[0]));errs++;}
  S.log.forEach(l=>{const m=l.m.match(/^CRISIS: ([^:]+)/);if(m)cnt[m[1].trim()]=(cnt[m[1].trim()]||0)+1;});
  // invariants
  S.players.forEach(p=>{['gold','mom','prod','mktg','hype','debt'].forEach(f=>{if(!(p[f]>=0)||!Number.isFinite(p[f])){console.log('BAD',f,p[f]);errs++}});if(p.culture<-5||p.culture>5){console.log('BADCUL');errs++}
    if(p.systems.length>12){console.log('too many systems');errs++}});
 }
}
console.log('errs',errs);console.log(cnt);
