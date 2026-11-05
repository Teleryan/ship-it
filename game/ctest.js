// Variant C rule checks. Run: node ctest.js
global.window=undefined;const E=require('./engine.js'),B=require('./bot.js'),D=require('./data.js');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
function toStep(S,step,minRound){let n=0;while(!S.over&&n++<20000&&!(S.step===step&&S.round>=(minRound||1)&&!S.dq.length)){const a=B.decide(S);if(!a||!E.act(S,a).ok)break}return S}
const mk=seed=>E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed,config:{varC:1}});
// phases
let S=mk(3);ok(JSON.stringify(D.phases.map(p=>p.rounds))==='[[1,3],[4,8],[9,11],[12,12]]','phase rounds 3/5/3/1');
// recruitment: one per player per round, shared pool
toStep(S,'place',1);const a=E.currentActor(S),p=S.players[a],b=S.players[1-a];
const g0=p.gold,n0=p.workers.length;let r=E.act(S,{type:'recruit',p:a,idx:0});ok(r.ok&&p.workers.length===n0+1&&p.gold===g0-3,'recruit costs 3G and adds a Junior');
ok(p.workers[p.workers.length-1].lvl==='Jr'&&!p.workers[p.workers.length-1].placed,'recruit is a Jr and can be placed this round');
ok(S.recruit[0].by===a,'offer marked taken');
ok(!E.canRecruit(S,a,1).ok,'second hire same round refused');
ok(!E.canRecruit(S,1-a,0).ok,'taken offer unavailable to others');
// Sr cannot be hired
S=mk(4);toStep(S,'hire',1);let pi=E.currentActor(S);S.players[pi].hand.push({id:'X1',disc:'ENG'});r=E.act(S,{type:'hire',p:pi,card:'X1',lvl:'Sr'});ok(!r.ok,'Sr hire refused');
// Jr cannot trigger system
S=mk(5);toStep(S,'place',4);pi=E.currentActor(S);let q=S.players[pi];q.systems=[{name:'Unit Tests',cat:'Stability',t:false}];q.workers.push({id:999,disc:'QA',lvl:'Jr',fat:0,placed:false,as:null,worked:false});
let o=E.placementOptions(S,pi,q.workers.find(w=>w.id===999)).find(x=>x.target==='sys:0');ok(o&&!o.ok&&/Senior/.test(o.reason),'Jr cannot trigger a system');
q.workers.push({id:1000,disc:'QA',lvl:'Sr',fat:0,placed:false,as:null,worked:false});o=E.placementOptions(S,pi,q.workers.find(w=>w.id===1000)).find(x=>x.target==='sys:0');ok(o&&o.ok,'Sr can trigger a system');
// build time and crunch
S=mk(6);toStep(S,'build',4);pi=E.currentActor(S);q=S.players[pi];q.rd=false;const sysDef=D.systems.find(s=>s.name==='Version Control');
q.gold=40;['ideas','code','process','buzz'].forEach(k=>q[k]=10);q.workers=[{id:901,disc:'ENG',lvl:'Jr',fat:0,placed:false,as:null,worked:false}];
const rd0=S.round,s0=q.systems.length;S.sysAvail['Version Control']=true;S.market.Stability=['Version Control'];
r=E.act(S,{type:'build',p:pi,name:'Version Control'});ok(r.ok&&q.building.length===1&&q.building[0].rdy===rd0+2&&q.systems.length===s0,'normal build ready in 2 rounds');
S=mk(6);toStep(S,'build',4);pi=E.currentActor(S);q=S.players[pi];q.rd=false;q.gold=40;['ideas','code','process','buzz'].forEach(k=>q[k]=10);q.workers=[{id:901,disc:'ENG',lvl:'Jr',fat:0,placed:false,as:null,worked:false}];S.market.Stability=['Version Control'];S.sysAvail['Version Control']=true;
const g1=q.gold;r=E.act(S,{type:'build',p:pi,name:'Version Control',crunch:'gold'});ok(r.ok&&q.building[0].rdy===S.round+1&&q.gold<g1,'crunch with Gold: ready next round, costs extra');
// completion
let rr=S.round;while((S.round===rr||S.step==='bid')&&!S.over){const x=B.decide(S);if(!x||!E.act(S,x).ok)break}
ok(q.systems.some(s=>s.name==='Version Control')||q.building.length===0,'rushed system finished at the next round');
// late builds blocked
S=mk(7);toStep(S,'build',11);pi=E.currentActor(S);ok(S.round===11,'reached round 11 build step');q=S.players[pi];q.systems=[];q.building=[];q.gold=40;['ideas','code','process','buzz'].forEach(k=>q[k]=10);q.workers=[{id:901,disc:'ENG',lvl:'Jr',fat:0,placed:false,as:null,worked:false}];S.market.Stability=['Version Control'];S.sysAvail['Version Control']=true;
ok(!E.canBuild(S,pi,'Version Control',false,undefined).ok,'normal build blocked in round 11');ok(E.canBuild(S,pi,'Version Control',false,'gold').ok,'crunched build allowed in round 11');
// conversion
S=mk(8);toStep(S,'place',12);pi=E.currentActor(S);q=S.players[pi];q.ideas=7;q.workers.push({id:902,disc:'ART',lvl:'Jr',fat:0,placed:false,as:null,worked:false});const pr0=q.prod;
r=E.act(S,{type:'place',p:pi,worker:902,target:'spot:convert',conv:'prod'});ok(r.ok&&q.ideas===1&&q.prod===pr0+2,'convert 6 Ideas into 2 Progress (3:1)');
// R&D rush
S=mk(9);toStep(S,'place',4);pi=E.currentActor(S);q=S.players[pi];q.rd=true;
ok(E.buildDelay(S,q,undefined)===1,'R&D makes the build a free rush');
// promotion
S=mk(10);toStep(S,'rest',4);pi=E.currentActor(S);q=S.players[pi];q.workers.push({id:903,disc:'ENG',lvl:'Jr',fat:1,placed:false,as:null,worked:true},{id:904,disc:'ENG',lvl:'Jr',fat:0,placed:false,as:null,worked:false});
q.gold=10;r=E.act(S,{type:'promote',p:pi,worker:904});ok(!r.ok,'cannot promote a worker who has not worked');r=E.act(S,{type:'promote',p:pi,worker:903});ok(r.ok&&q.gold===10,'free promotion of a rested worker who has worked');
// A/B untouched
const SA=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:3});ok(!SA.cfg.varC&&D.phases[0].rounds[1]===2,'Env A rules unchanged (phase 1 ends round 2)');

// Variant D: Burnout
{const mkD=(n,seed)=>E.newGame(Array.from({length:n},(_,i)=>({name:'P'+i,bot:true})),{seed,config:{varC:1,burnout:1}});
 let allOk=true,seen=0;for(const n of [2,4,6]){for(let sd=1;sd<=6;sd++){const S=mkD(n,sd);B.run(S,40000);if(!S.over)allOk=false;S.players.forEach(p=>{if(p.burnout<0||p.burnout>6)allOk=false;seen+=p.burnout});if(!(S.scores||E.score(S)).every(x=>typeof x.parts.burnout==='number'))allOk=false}}
 ok(allOk&&seen>0,'Env D: bot games finish, Burnout stays on the track and is scored');
 const C=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:2,config:{varC:1}});B.run(C,40000);ok(C.players.every(p=>p.burnout===0)&&C.cfg.burnout===0,'Env C: Burnout stays off');
 const S=mkD(2,5);const p=S.players[0];p.burnout=0;p.culture=2;ok(E.burnBand(S,p)==='Energized','band: Energized at Burnout 0 and Culture 2');p.culture=0;ok(E.burnBand(S,p)==='Steady','band: Steady');p.burnout=3;ok(E.burnBand(S,p)==='Strained','band: Strained at 3');p.burnout=5;ok(E.burnBand(S,p)==='Burned out','band: Burned out at 5');p.burnout=6;ok(E.burnBand(S,p)==='Meltdown','band: Meltdown at 6');
 E.statChange(S,0,'burnout',99);ok(p.burnout===6,'Burnout is capped at the top of the track');E.statChange(S,0,'burnout',-99);ok(p.burnout===0,'Burnout cannot go below 0');}

// Variant D: Training
{const mk=()=>E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1,trainNeeded:2}});
 const S=mk();let g=0;while(g++<4000&&!(S.round>=4&&S.step==='rest'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}
 const pi=E.currentActor(S),p=S.players[pi];p.workers.forEach(w=>{w.placed=false;w.build=null;w.lvl='Jr';w.trained=0;w.training=false});p.rs.trains=0;p.promos=0;p.gold=10;p.culture=0;
 const w=p.workers[0];let r=E.act(S,{type:'promote',p:pi,worker:w.id});ok(!r.ok,'cannot promote an untrained Junior');
 r=E.act(S,{type:'train',p:pi,worker:w.id});ok(r.ok&&p.gold===9&&p.culture===1&&w.trained===1&&w.training,'train: costs 1G, +1 Culture, counts one session');
 r=E.act(S,{type:'train',p:pi,worker:w.id});ok(!r.ok,'a worker already training cannot train again');
 r=E.act(S,{type:'promote',p:pi,worker:w.id});ok(!r.ok,'one training is not enough to promote');
 const w2=p.workers[1];w2.trained=1;r=E.act(S,{type:'train',p:pi,worker:w2.id});ok(r.ok&&w2.trained===2,'second training');
 r=E.act(S,{type:'train',p:pi,worker:p.workers[2].id});ok(!r.ok,'training limit per round');
 r=E.act(S,{type:'promote',p:pi,worker:w2.id});ok(r.ok&&w2.lvl==='Sr'&&w2.trained===0,'promote after two trainings');
 r=E.act(S,{type:'fire',p:pi,worker:p.workers[3].id});ok(!r.ok,'releasing workers is removed in Variant D');
 while(S.step==='rest'&&!S.over){const q=E.currentActor(S);E.act(S,{type:'done',p:q})}
 let g2=0;while(g2++<200&&S.step!=='place'&&!S.over){const a=B.decide(S);if(!a)break;E.act(S,a)}
 ok(w.benched==='Training'&&E.placementOptions(S,pi,w)[0].ok===false,'a trainee sits out the next round');
 const C=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1}});ok(!E.act(C,{type:'train',p:0,worker:1}).ok,'Env C: no training');}
{ // Hire + Train at the Hire step: pay both costs, trainee sits out this round and next
 const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1}});let g=0;while(g++<4000&&!(S.round>=2&&S.step==='hire'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}
 const pi=E.currentActor(S),p=S.players[pi];p.hand=[{id:'t1',disc:'ENG'},{id:'t2',disc:'DES'},{id:'t3',disc:'ART'},{id:'t4',disc:'ENG'}];p.rs.trains=0;p.culture=0;p.gold=E.hireCost(S,pi,'Jr')+S.cfg.trainCost-1;
 let r=E.act(S,{type:'hire',p:pi,card:p.hand[0].id,lvl:'Jr',train:true});ok(!r.ok,'hire+train refused without gold for both');
 p.gold=10;const n=p.workers.length,cost=E.hireCost(S,pi,'Jr');r=E.act(S,{type:'hire',p:pi,card:p.hand[0].id,lvl:'Jr',train:true});const w=p.workers[p.workers.length-1];
 ok(r.ok&&p.workers.length===n+1&&p.gold===10-cost-S.cfg.trainCost&&p.culture===S.cfg.trainCulture&&w.trained===1&&w.training,'hire+train: pays hire + training, +Culture, counts 1 session');
 ok(E.placementOptions(S,pi,w)[0].ok===false,'a hire+train worker cannot be placed this round');
 r=E.act(S,{type:'hire',p:pi,card:p.hand[0].id,lvl:'Jr',train:true});ok(r.ok,'second hire+train allowed up to the per-round limit');
 r=E.act(S,{type:'hire',p:pi,card:p.hand[0].id,lvl:'Jr',train:true});ok(!r.ok,'hire+train respects the training limit per round');}
{ // Train is also available during Place (e.g. for a worker who is already sitting out)
 const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1}});let g=0;while(g++<4000&&!(S.round>=3&&S.step==='place'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}
 const pi=E.currentActor(S),p=S.players[pi];const w=p.workers.find(x=>x.lvl==='Jr'&&!x.placed&&!x.build);p.rs.trains=0;p.gold=5;
 if(w){w.benched='Training';w.trained=1;w.training=false;const r=E.act(S,{type:'train',p:pi,worker:w.id});ok(r.ok&&w.trained===2&&w.training&&p.gold===4,'Train during Place works for a worker already sitting out (2nd training)');ok(E.currentActor(S)===pi,'training does not use up the placement turn');}}
{ // flowV2: Upkeep opens each round (not round 1), Income, then Bid; Rest and Milestones are one step
 const cfg={varC:1,burnout:1,train:1,flowV2:1};const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:9,config:cfg});const seen=[];let last='',g=0;
 while(g++<9000&&!S.over&&S.round<4){const k=S.round+':'+S.step;if(k!==last){seen.push(k);last=k}const a=B.decide(S);if(!a)break;const r=E.act(S,a);if(!r.ok)break}
 ok(seen.slice(0,8).join(' ')==='1:setup 1:bid 1:draft 1:hire 1:place 1:build 1:rest 2:bid','flowV2 round 1: bid, draft, hire, place, build, rest, then round 2 opens at the bid');
 ok(!seen.some(k=>/:milestones/.test(k)),'flowV2: no separate Milestones step');
 const L=S.log.map(l=>l.m),iU=L.findIndex(m=>/^UPKEEP/.test(m)),iI=L.findIndex(m=>/^INCOME/.test(m)),iI2=L.findIndex((m,i)=>i>iI&&/^INCOME/.test(m));
 ok(iU>iI&&iU<iI2,'flowV2: no Upkeep in round 1; the first Upkeep comes before round 2 Income');
 const bidAfterInc=L.findIndex((m,i)=>i>iI2&&/^BLIND BID/.test(m));ok(bidAfterInc>iI2,'flowV2: Income comes before the Bid');
 const T=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:9,config:cfg});let g2=0;while(g2++<9000&&!(T.round>=2&&T.step==='rest'&&!T.dq.length)){const a=B.decide(T);if(!a)break;E.act(T,a)}
 const pq=E.currentActor(T);ok(!E.act(T,{type:'claim',p:pq,mile:-1}).ok,'flowV2: claim is accepted by the Rest step handler (bad id refused)');
 const O=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:9,config:{varC:1}});let g3=0,seenO=[],lo='';while(g3++<9000&&!O.over&&O.round<3){const k=O.round+':'+O.step;if(k!==lo){seenO.push(k);lo=k}const a=B.decide(O);if(!a)break;E.act(O,a)}
 ok(seenO.some(k=>/:milestones/.test(k)),'older order keeps its Milestones step when flowV2 is off');}
{ // training settings: defaults 1 and 1; duration 2 keeps a trainee out for two rounds
 const def=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:3,config:{varC:1,burnout:1,train:1}});ok(def.cfg.trainNeeded===1&&def.cfg.trainDuration===1,'training defaults: 1 training to promote, 1 round long');
 const mk=d=>{const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1,trainDuration:d}});let g=0;while(g++<4000&&!(S.round>=4&&S.step==='rest'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}return S};
 for(const d of [1,2]){const S=mk(d),pi=E.currentActor(S),p=S.players[pi];p.workers.forEach(w=>{w.placed=false;w.build=null;w.lvl='Jr';w.trained=0;w.training=false;w.trainLeft=0;w.benched=false});p.rs.trains=0;p.gold=10;
  const w=p.workers[0];const r=E.act(S,{type:'train',p:pi,worker:w.id});ok(r.ok&&w.trainLeft===d,'Rest training sets '+d+' round(s) away');
  const p1=E.act(S,{type:'promote',p:pi,worker:w.id});ok(p1.ok&&w.lvl==='Sr','one training promotes at the default (trainNeeded 1), duration '+d);
  const T=mk(d),pj=E.currentActor(T),q=T.players[pj];q.workers.forEach(x=>{x.placed=false;x.build=null;x.trainLeft=0;x.benched=false});}
 {const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1,trainDuration:2,flowV2:1}});let g=0;while(g++<4000&&!(S.round>=2&&S.step==='hire'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}
  const pi=E.currentActor(S),p=S.players[pi];p.hand=[{id:'x1',disc:'ENG'}];p.gold=10;p.rs.trains=0;E.act(S,{type:'hire',p:pi,card:'x1',lvl:'Jr',train:true});const nw=p.workers[p.workers.length-1];
  ok(nw.trainNow&&nw.trainLeft===1,'Hire + Train with duration 2: out this round and one more');}
 {const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1,trainDuration:1,flowV2:1}});let g=0;while(g++<4000&&!(S.round>=2&&S.step==='hire'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}
  const pi=E.currentActor(S),p=S.players[pi];p.hand=[{id:'x1',disc:'ENG'}];p.gold=10;p.rs.trains=0;E.act(S,{type:'hire',p:pi,card:'x1',lvl:'Jr',train:true});const nw=p.workers[p.workers.length-1];
  ok(nw.trainNow&&nw.trainLeft===0,'Hire + Train with duration 1: out for this round only');}}
{ // mini draft every round that does not start a phase
 const cfg={varC:1,burnout:1,train:1,flowV2:1,draftMiniDelta:-1};const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true},{name:'C',bot:true}],{seed:5,config:cfg});let g=0,sizes=[];
 while(g++<9000&&!S.over&&S.round<6){if(S.step==='bid'&&S.dq[0]&&S.dq[0].t==='bid'&&sizes.every(x=>x[0]!==S.round))sizes.push([S.round,S.draft.cards.length]);const a=B.decide(S);if(!a)break;E.act(S,a)}
 const mid=sizes.find(x=>x[0]===2);ok(mid&&mid[1]===2,'round 2 bid shows a face-up draft of players - 1 cards (3 players -> 2)');}
{ // promote after resting (promoByRest): worked, then sat out a round, at most Tired
 const mk=f=>{const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:11,config:{varC:1,burnout:1,train:1,promoByRest:f}});let g=0;while(g++<4000&&!(S.round>=4&&S.step==='rest'&&!S.dq.length)){const a=B.decide(S);if(!a)break;E.act(S,a)}return S};
 for(const f of [0,1]){const S=mk(f),pi=E.currentActor(S),p=S.players[pi];p.workers.forEach(w=>{w.lvl='Jr';w.trained=0;w.placed=false;w.build=null;w.training=false;w.trainNow=false;w.worked=true;w.fat=1});p.promos=0;p.gold=10;
  const w=p.workers[0];const r=E.act(S,{type:'promote',p:pi,worker:w.id});ok(r.ok===!!f,'promoByRest '+f+': a Tired Junior who worked and sat out '+(f?'can':'cannot')+' be promoted');
  if(f){const w2=p.workers[1];w2.fat=2;const r2=E.act(S,{type:'promote',p:pi,worker:w2.id});ok(!r2.ok||p.promos>0,'rule still respects the promotion limit');p.promos=0;const w3=p.workers[2];w3.fat=2;ok(!E.act(S,{type:'promote',p:pi,worker:w3.id}).ok,'an Over-Tired Junior needs more rest first');}}}
{ // Variant D: Insight is off the board at every player count
 for(const n of [2,3,4,5,6]){const seats=[];for(let i=0;i<n;i++)seats.push({name:'P'+i,bot:true});
  const D=E.newGame(seats,{seed:3,config:{varC:1,smallDrop:['insight'],smallMax:6}}); let any=false; for(let ph=0;ph<4;ph++){D.phase=ph; if(E.activeSpots(D).some(x=>x.id==='insight'))any=true}
  ok(!any,'Variant D: Insight removed at '+n+' players');
  const C=E.newGame(seats,{seed:3,config:{varC:1}}); C.phase=1; ok(E.activeSpots(C).some(x=>x.id==='insight'),'Env C keeps Insight at '+n+' players');}
 const T=E.newGame([{name:'A',bot:true},{name:'B',bot:true},{name:'C',bot:true}],{seed:3,config:{varC:1,smallDrop:['insight'],smallMax:2}}); T.phase=1; ok(E.activeSpots(T).some(x=>x.id==='insight'),'smallMax limits the removal by player count'); }
{ // gate difficulty
 const mk=(lv)=>{const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:21,config:{varC:1,gateLevels:lv}}); let g=0; while(!S.over&&!S.gateSet&&g++<4000){const r=require('./bot.js').step(S); if(!r.ok)break} return S;};
 const M=mk(null), H=mk(['H','H','H','H']), Z=mk(['E','M','H','E']);
 ok(M.gateSet&&M.gateSet.every(g=>!g.lvl||g.lvl==='M'),'no gateLevels: gates are Medium as printed');
 ok(H.gateSet.every(g=>g.lvl==='H'),'Hard on every phase');
 const sum=S=>S.gateSet.reduce((t,g)=>t+(g.fund||0)+(g.vp||0),0), pen=S=>S.gateSet.reduce((t,g)=>t+g.penalty,0);
 ok(pen(H)>pen(M),'Hard gates have bigger miss penalties'); ok(sum(H)>=sum(M),'Hard gates pay at least as much');
 ok(Z.gateSet.map(g=>g.lvl).join('')==='EMHE','levels follow the phase order given');
 const num=g=>g.reqs.map(r=>+((r.match(/^(\d+)\+/)||[])[1]||0)).reduce((a,b)=>a+b,0);
 ok(H.gateSet.reduce((t,g)=>t+num(g),0)>M.gateSet.reduce((t,g)=>t+num(g),0),'Hard gates have higher targets');
 const dm=H.gateSet.concat(M.gateSet).map(g=>g.reqs.join('|')); ok(dm.every(x=>!/Debt < (0|100)/.test(x)),'Debt limits stay in range'); }
{ // Variant D: no discarding unhired cards
 const mk=cfg=>{const S=E.newGame([{name:'A',bot:true},{name:'B',bot:true}],{seed:9,config:Object.assign({varC:1},cfg)}); return S;};
 const stepTo=S=>{let g=0;while(!S.over&&g++<4000){const p0=S.players[0]; if(S.step==='hire'&&p0.hand.length)return true; if(!require('./bot.js').step(S).ok)break}return false};
 const D0=mk({hireDiscard:0}); if(stepTo(D0)){const p=D0.players[E.currentActor(D0)]; const r=E.act(D0,{type:'discard',p:p.id,card:p.hand[0].id}); ok(!r.ok,'Variant D: discarding a card is refused');}
 const C0=mk({hireDiscard:1}); if(stepTo(C0)){const p=C0.players[E.currentActor(C0)]; ok(E.act(C0,{type:'discard',p:p.id,card:p.hand[0].id}).ok,'other variants can still discard');} }
{ // v2 audit layer
 const base={varC:1,burnout:1,train:1,flowV2:1,v2:1,recruitDelta:-1,qaAllowedPreProd:1,hireDiscard:0,promoByRest:1,recruitOnly:0,recruitLadder:0,leanRound:0,cultureFold:0,recruitCost:3};
 const run=(n,cfg,seed)=>{const S=E.newGame(Array.from({length:n},(_,i)=>({name:'P'+i,bot:true})),{seed:seed||11,config:Object.assign({},base,cfg||{})});return S;};
 let S2=run(2); ok(S2.cfg.goldPerVP===4&&S2.cfg.catchUpOrder===1,'v2: layer applies (goldPerVP 4, catch-up order)');
 ok(S2.players.every(p=>p.miles.length===2),'v2: milestone hand is 2 at 2P'); ok(run(4).players.every(p=>p.miles.length===3),'v2: milestone hand stays 3 at 4P');
 { // closures, extra spots
   const T=run(2,{closeByN:{2:6}},5); let g=0; while(!(T.step==='place'&&T.round>=2)&&g++<8000){if(!B.step(T).ok)break}
   const closed=Object.keys(T.closed||{}); ok(closed.length===6,'v2: Industry News (when switched on) closes 6 spots ('+closed.length+')');
   const p=T.players[E.currentActor(T)]; const bad=p.workers.map(w=>E.placementOptions(T,p.id,w)).flat().filter(o=>o.target&&o.target.startsWith('spot:')&&T.closed[o.target.slice(5)]&&o.ok); ok(bad.length===0,'v2: closed spots cannot be used');
   const n2=E.activeSpots(run(2)).length, n4=E.activeSpots(run(4)).length; ok(n2<n4&&!E.activeSpots(run(2)).some(s=>s.id==='code2'),'v2: 2P plays on a smaller board ('+n2+' vs '+n4+' spots in Concept)');
   ok(run(6).data.spots.filter(s=>/_b$/.test(s.id)).length===6&&run(5).data.spots.filter(s=>/_b$/.test(s.id)).length===4&&run(4).data.spots.filter(s=>/_b$/.test(s.id)).length===0,'v2: 4 extra spots at 5P, 6 at 6P'); }
 { // catch-up order: lowest score first; no bid step
   const T=run(3,null,7); let g=0; while(!(T.step==='draft'&&T.round>=4)&&!T.over&&g++<12000){if(!B.step(T).ok)break}
   if(!T.over){const sc=E.score(T).map(x=>x.total);ok(sc[T.order[0]]<=sc[T.order[T.order.length-1]],'v2: catch-up order puts the lowest score first'); ok(!T.dq.some(d=>d.t==='bid'),'v2: no bid step');} }
 { // Train only in Clean up
   const T=run(2,null,9); let g=0; while(!(T.step==='hire')&&g++<4000){if(!B.step(T).ok)break}
   const p=T.players[E.currentActor(T)]; p.hand.push({id:'XT',disc:'ENG'}); p.gold=20; ok(!E.act(T,{type:'hire',p:p.id,card:'XT',lvl:'Jr',train:true}).ok,'v2: Hire + Train is refused');
   let w=p.workers.find(x=>x.lvl==='Jr'&&!x.placed); if(!w){w={id:777,disc:'ENG',lvl:'Jr',fat:0,placed:false,as:null,worked:false};p.workers.push(w)} ok(!E.act(T,{type:'train',p:p.id,worker:w.id}).ok,'v2: Train is refused outside Clean up'); }
 ok(run(2).promoGold===undefined&&E.promoGold(run(2))===2&&E.promoGold(run(4))===0,'v2: promotion costs 2G at 2-3P only');
 { // Talent unavailable with an empty pool
   const T=run(2,null,13); let g=0; while(!(T.step==='place'&&T.round>=2)&&g++<8000){if(!B.step(T).ok)break}
   T.recruit.forEach(o=>{o.by=0}); const p=T.players[E.currentActor(T)], w=p.workers.find(x=>!x.placed&&x.fat<2); const o=E.placementOptions(T,p.id,w).find(x=>x.target==='spot:talent1'); ok(!o||!o.ok,'v2: Talent is unavailable when the recruitment pool is empty'); }
}
{ // lean loop: recruit-only, price ladder, lean round, culture fold
 const base={varC:1,burnout:1,train:1,flowV2:1,v2:1,recruitDelta:-1,qaAllowedPreProd:1,hireDiscard:0,promoByRest:1};
 const run=(n,cfg,seed)=>E.newGame(Array.from({length:n},(_,i)=>({name:'P'+i,bot:true})),{seed:seed||21,config:Object.assign({},base,cfg||{})});
 { const T=run(3); ok(T.cfg.recruitOnly===1&&T.cfg.leanRound===1&&T.cfg.cultureFold===1,'lean: flags on in the v2 layer');
   let g=0,saw={draft:0,hire:0,build:0},manage=0; while(!T.over&&g++<20000){ if(saw[T.step]!==undefined)saw[T.step]++; if(!B.step(T).ok)break } ok(T.over&&!saw.draft&&!saw.hire&&!saw.build,'lean: no Draft, Hire or Build step ever occurs ('+JSON.stringify(saw)+')'); }
 { const T=run(4,null,22); let g=0; while(!(T.step==='place'&&T.round>=2)&&g++<8000){if(!B.step(T).ok)break}
   const ids=[0,1,2].map(i=>E.recruitCost(T,T.order[0])); T.players.forEach(p=>p.gold=20); E.act(T,{type:'recruit',p:E.currentActor(T),idx:0});
   const c2=E.recruitCost(T,T.order[1]); ok(c2===ids[0]+1,'lean: second recruit in the round costs 1G more ('+ids[0]+' -> '+c2+')'); }
 { const T=run(2,null,23); const p=T.players[0]; const b=p.burnout; E.statChange(T,0,'culture',-1); ok(p.burnout===b+1&&p.culture===0,'fold: Culture loss adds Burnout'); E.statChange(T,0,'culture',2); ok(p.burnout===Math.max(0,b+1-2),'fold: Culture gain eases Burnout');
   p.burnout=0; ok(E.cultureOf(T,p)===5,'fold: virtual Culture reads base minus Burnout'); p.burnout=4; ok(E.cultureOf(T,p)===1,'fold: Burnout 4 reads as Culture 1'); }
 { const T=run(2,null,24); let g=0; while(T.step!=='rest'&&!T.over&&g++<8000){if(!B.step(T).ok)break}
   ok(T.step==='rest','lean: Place goes straight to the Manage step'); const p=T.players[E.currentActor(T)]; const r=E.act(T,{type:'build',p:p.id,name:'__none__'}); ok(!r.ok&&/Unknown/.test(r.error||''),'lean: build actions are routed in the Manage step'); }
}
console.log('fails',fails);
