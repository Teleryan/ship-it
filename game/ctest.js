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
console.log('fails',fails);
