
/* ============================================================
   SHIP IT!: DATA LAYER  (pure data, no logic)
   Everything here is editable from the Data Studio at runtime.
   Systems / milestones / objectives were extracted from ship_it_cards.pdf.
   ============================================================ */
(function(root){
const D = {};

D.version = "v47-proto-0.1";

D.disciplines = {
  ENG:{name:"Engineer",   cat:"Development", short:"Builds Progress, can fix Debt", util:"Alt action: fix Tech Debt instead of gaining Progress"},
  ART:{name:"Artist",     cat:"Creative", short:"Builds Progress, can make Hype", util:"Alt action: gain Hype instead of Progress"},
  DES:{name:"Designer",   cat:"Creative", short:"Amplifies a paired placement", util:"Amplifier: +1 value when paired with another placement this round"},
  QA: {name:"Quality",    cat:"Development", short:"Removes Tech Debt", util:"Reduces Tech Debt only. Bug Bounty: +1G per Debt removed"},
  PX: {name:"Community",  cat:"Marketing", short:"Objective swaps", util:"Jr resting: draw 2 objectives keep 1. Sr placed: swap an objective"},
  DATA:{name:"Analytics", cat:"Operations", short:"Milestone swaps", util:"Jr resting: draw 2 milestones keep 1. Sr placed: swap a milestone"},
  ADV:{name:"Advertising",cat:"Marketing", short:"+1 Hype on marketing", util:"+1 Hype on marketing spots"},
  PM: {name:"Product Manager",cat:"Operations", short:"Wild: acts as DES or DATA", util:"Declare as DES or DATA when placed", wild:["DES","DATA"]},
  PROD:{name:"Producer",  cat:"Operations", short:"Wild: acts as QA, ADV or DES", util:"Declare as QA, ADV or DES when placed", wild:["QA","ADV","DES"]}
};
// words shown to players (internal effect strings keep the short forms; the UI translates them)
D.typeRules = {Reach:"Each Reach system you own: your Hype fades 1 less each round. The player with the most Reach systems at the end (at least 2, no ties): +5 VP.", Revenue:"Revenue systems pay gold when triggered. Early Access and Publisher Deal also pay +1G at every Income.", Innovation:"Innovation systems add Tech Debt when built but boost your workers on every placement.", Stability:"Stability systems keep Tech Debt down."};
D.labels = { Prod:"Progress", Mktg:"Marketing", Cult:"Culture", Jr:"Junior", Sr:"Senior", Mile:"Milestone", Miles:"Milestones" };
D.categories = {
  Operations: { color:"#16a085", discs:["PROD","PM","DATA"] },
  Development:{ color:"#2980b9", discs:["ENG","QA"] },
  Creative:   { color:"#8e44ad", discs:["DES","ART"] },
  Marketing:  { color:"#e67e22", discs:["PX","ADV"] }
};
// copies in the deck: "2+" cards used in every game, "3+" extra cards added for 3+ players
D.deck = { base:4, extra:2 };

D.phases = [
  {id:0, name:"Pre-Production", rounds:[1,2],   color:"#9b59b6"},
  {id:1, name:"Production",     rounds:[3,8],   color:"#3498db"},
  {id:2, name:"Polish",         rounds:[9,11],  color:"#27ae60"},
  {id:3, name:"Launch",         rounds:[12,12], color:"#e74c3c"}
];

D.symbols = {
  circle:  {glyph:"●", color:"#3498db", meaning:"Network / Online"},
  square:  {glyph:"■", color:"#27ae60", meaning:"Community / Social"},
  triangle:{glyph:"▲", color:"#e67e22", meaning:"Tech / Engine"},
  diamond: {glyph:"◆", color:"#9b59b6", meaning:"Art / Creative"},
  hexagon: {glyph:"⬢", color:"#c0392b", meaning:"Quality / Polish"},
  oval:    {glyph:"⬬", color:"#e91e63", meaning:"Marketing / Reach"}
};

/* ---------- MAIN BOARD SPOTS ----------
   discs: allowed disciplines ("ANY" = all). mode: single | shared (1 per player) | multi (many players)
   fx: effect string (see Engine.parseEffect). debt: Tech Debt added when used (red corner).
   phases: phase ids where the spot exists. special: hard-coded behaviour. */
D.spots = [
 // PRE-PRODUCTION
 {id:"concept1",row:"CONCEPT",  discs:["DES","DATA"],fx:"+1 Progress",         debt:1,phases:[0]},
 {id:"concept2",row:"CONCEPT",  discs:["DES","DATA"],fx:"+2 Progress",         debt:1,phases:[0]},
 {id:"designreview",row:"CONCEPT",discs:["ANY"],crew:[["Creative","Development"]],fx:"+4 Progress, +2 Marketing",debt:1,phases:[0],note:"Crew: Creative + Development"},
 {id:"proto1",  row:"PROTOTYPE",discs:["ENG","ART"],fx:"+1 Progress",          debt:1,phases:[0]},
 {id:"proto2",  row:"PROTOTYPE",discs:["ENG","ART"],fx:"+2 Progress",          debt:1,phases:[0]},
 {id:"protosprint",row:"PROTOTYPE",discs:["ANY"],crew:[["Development","Creative"]],fx:"+4 Progress, +1 Culture",debt:1,phases:[0],note:"Crew: Development + Creative"},
 {id:"pitch1",  row:"PITCH",    discs:["PX","ADV"], fx:"+2 Hype",          debt:0,phases:[0],mkt:true},
 {id:"pitch2",  row:"PITCH",    discs:["PX","ADV"], fx:"+1 Marketing, +3G",     debt:0,phases:[0],mkt:true},
 {id:"talent1", row:"TALENT",   discs:["ANY"],      fx:"",special:"talent",debt:0,phases:[0],note:"Hire -1G"},
 {id:"talent2", row:"TALENT",   discs:["ANY"],      fx:"",special:"talent",debt:0,phases:[0],note:"Hire -1G"},
 // PRODUCTION
 {id:"build1",  row:"BUILD",    discs:["ENG","DES"],fx:"+1 Progress",          debt:1,phases:[1]},
 {id:"build2",  row:"BUILD",    discs:["ENG","DES"],fx:"+2 Progress",          debt:1,phases:[1]},
 {id:"build3",  row:"BUILD",    discs:["ENG","DES"],fx:"+2 Progress",          debt:1,phases:[1]},
 {id:"buildsprint",row:"BUILD",discs:["ANY"],crew:[["Development","Creative"]],fx:"+6 Progress",debt:2,phases:[1],note:"Crew: Development + Creative"},
 {id:"create1", row:"CREATE",   discs:["ART","DES"],fx:"+1 Progress",          debt:1,phases:[1]},
 {id:"create2", row:"CREATE",   discs:["ART","DES"],fx:"+1 Progress, +1 Hype", debt:1,phases:[1]},
 {id:"create3", row:"CREATE",   discs:["ART","DES"],fx:"+2 Hype",          debt:1,phases:[1]},
 {id:"artpush",row:"CREATE",discs:["ANY"],crew:[["Creative","Marketing"]],fx:"+3 Progress, +3 Hype",debt:1,phases:[1],mkt:true,note:"Crew: Creative + Marketing"},
 {id:"test1",   row:"TEST",     discs:["QA"],       fx:"-1 Debt",          debt:0,phases:[1]},
 {id:"test2",   row:"TEST",     discs:["QA"],       fx:"-2 Debt",          debt:0,phases:[1]},
 {id:"test3",   row:"TEST",     discs:["QA","ENG"], fx:"-1 Debt, +1 Progress", debt:0,phases:[1]},
 {id:"testlab",row:"TEST",discs:["ANY"],crew:[["Development","Operations"]],fx:"-5 Debt, +1 Progress",debt:0,phases:[1],note:"Crew: Development + Operations"},
 {id:"market1", row:"MARKET",   discs:["PX","ADV"], fx:"+2 Hype",          debt:0,phases:[1],mkt:true},
 {id:"market2", row:"MARKET",   discs:["DATA"],     fx:"+2 Marketing",          debt:0,phases:[1],mkt:true},
 {id:"market3", row:"MARKET",   discs:["PX","ADV"], fx:"+3 Hype",          debt:0,phases:[1],mkt:true},
 {id:"campaign",row:"MARKET",discs:["ANY"],crew:[["Marketing","Operations"]],fx:"+3 Marketing, +3 Hype",debt:0,phases:[1],mkt:true,note:"Crew: Marketing + Operations"},
 // POLISH
 {id:"opt1",    row:"OPTIMIZE", discs:["ENG","QA"], fx:"-1 Debt, +1 Progress", debt:0,phases:[2]},
 {id:"hardening",row:"OPTIMIZE",discs:["ANY"],crew:[["Development","Operations"]],fx:"-4 Debt, +1 Progress",debt:0,phases:[2],note:"Crew: Development + Operations"},
 {id:"opt3",    row:"OPTIMIZE", discs:["QA"],       fx:"-2 Debt, +1 Progress", debt:0,phases:[2]},
 {id:"refine1", row:"REFINE",   discs:["ART","DES"],fx:"+1 Progress",          debt:1,phases:[2]},
 {id:"refine2", row:"REFINE",   discs:["ART","DES"],fx:"+2 Hype",          debt:0,phases:[2]},
 {id:"artpass",row:"REFINE",discs:["ANY"],crew:[["Creative","Development"]],fx:"+3 Progress, +3 Hype",debt:1,phases:[2],note:"Crew: Creative + Development"},
 {id:"playtest1",row:"PLAYTEST",discs:["DES"],      fx:"+2 Progress",          debt:1,phases:[2]},
 {id:"playtest2",row:"PLAYTEST",discs:["DES","DATA"],fx:"+1 Progress, Draw 1 Milestone",debt:1,phases:[2]},
 {id:"playsession",row:"PLAYTEST",discs:["ANY"],crew:[["Creative","Operations"]],fx:"+4 Progress, +2 Marketing",debt:1,phases:[2],note:"Crew: Creative + Operations"},
 {id:"pmarket1",row:"MARKET",   discs:["PX","ADV"], fx:"+2 Hype, +1 Marketing", debt:0,phases:[2],mkt:true,excl:true},
 {id:"launchprep",row:"MARKET",discs:["ANY"],crew:[["Marketing","Operations"]],fx:"+3 Hype, +3 Marketing",debt:0,phases:[2],mkt:true,excl:true,note:"Crew: Marketing + Operations"},
 // LAUNCH (values as printed on the board; see config.launchMult)
 {id:"ship",    row:"SHIP",     discs:["ENG","QA"], fx:"-4 Debt",          debt:0,phases:[3],mode:"single",excl:true},
 {id:"keynote", row:"KEYNOTE",  discs:["ADV","PX"], fx:"+6 Hype, +2 Marketing", debt:0,phases:[3],mode:"single",excl:true,mkt:true},
 {id:"press",   row:"PRESS",    discs:["ADV","PX"], fx:"+2 Hype, +2 Marketing", debt:0,phases:[3],mode:"multi",mkt:true},
 {id:"platform",row:"PLATFORM", discs:["ENG","DES"],fx:"+2 Progress",          debt:0,phases:[3],mode:"multi"},
 {id:"party",   row:"PARTY",    discs:["ANY"],      fx:"+2 Hype, +2 Culture",debt:0,phases:[3],mode:"multi"},
 {id:"support", row:"SUPPORT",  discs:["QA","PX"],  fx:"-2 Debt, +2 Marketing", debt:0,phases:[3],mode:"multi"},

 // CREW SPOTS (2 or 3 workers from the listed categories; each crew worker is placed and earns the skill of the role they fill)
 {id:"kickoff", row:"CREW",     discs:["ANY"],crew:[["Creative","Operations"]],fx:"+4 Progress, +2 Culture",debt:0,phases:[0],note:"Crew: Creative + Operations"},
 {id:"pitchteam",row:"CREW",    discs:["ANY"],crew:[["Marketing","Creative"]],fx:"+4 Hype, +2 Marketing",debt:0,phases:[0],mkt:true,note:"Crew: Marketing + Creative"},
 {id:"vslice",  row:"CREW",     discs:["ANY"],crew:[["Creative","Development","Operations"]],fx:"+8 Progress, +2 Culture",debt:2,phases:[1,2],note:"Crew of 3: Creative + Development + Operations"},
 {id:"feature", row:"CREW",     discs:["ANY"],crew:[["Development","Operations"]],fx:"+5 Progress, -1 Debt",debt:0,phases:[1,2],note:"Crew: Development + Operations"},
 {id:"playlab", row:"CREW",     discs:["ANY"],crew:[["Development","Marketing"]],fx:"-3 Debt, +3 Hype",debt:0,phases:[1],mkt:true,note:"Crew: Development + Marketing"},
 {id:"trailer", row:"CREW",     discs:["ANY"],crew:[["Creative","Marketing"]],fx:"+5 Hype, +3 Marketing",debt:0,phases:[2],mkt:true,note:"Crew: Creative + Marketing"},
 {id:"polish",  row:"CREW",     discs:["ANY"],crew:[["Development","Creative"]],fx:"+5 Progress, -2 Debt",debt:1,phases:[2],note:"Crew: Development + Creative"},
 {id:"launchcrew",row:"CREW",   discs:["ANY"],crew:[["Development","Creative","Marketing"]],fx:"+12 Progress, +8 Hype",debt:0,phases:[3],mode:"single",mkt:true,note:"Crew of 3: Development + Creative + Marketing"},
 {id:"warroom", row:"CREW",     discs:["ANY"],crew:[["Development","Operations"]],fx:"-6 Debt, +6 Progress",debt:0,phases:[3],mode:"single",note:"Crew: Development + Operations"},
 // SHARED SPOTS (one worker per player each; always usable)
 {id:"team",    row:"TEAM EVENT",discs:["ANY"],crew:[["Any","Any"]],fx:"+2 Culture",special:"team",cost:{gold:3},debt:0,phases:[0,1,2,3],mode:"single",tile:"2 different roles + 3G: +2 Culture",note:"Send 2 workers who have different roles (any two roles, but not the same role twice) and pay 3 Gold. Your studio gains +2 Culture."},
 {id:"insight", row:"INSIGHT",   discs:["PX","DATA"],fx:"Draw 1 Milestone",debt:0,phases:[0,1,2,3],mode:"shared"},
 {id:"outsource",row:"OUTSOURCE",discs:["ANY"],fx:"",special:"outsource",debt:0,phases:[0,1],mode:"single",note:"Jr +3G / Sr +5G"},
 {id:"mentor",  row:"MENTOR",    discs:["ANY"],srOnly:true,fx:"",special:"mentor",debt:2,phases:[1,2],mode:"shared",note:"Sr only: promote a Jr of the same discipline"},
 {id:"rd",      row:"CONCEPT",   discs:["ANY"],crew:[["Creative","Development"],["Operations","Marketing"]],fx:"",special:"rd",debt:0,phases:[0,1,2],mode:"single",tile:"Next system −3 skills",note:"R&D crew: Creative + Development, or Operations + Marketing. Your next system this round costs 3 fewer skills (minimum 1)"},
 {id:"workshop",row:"WORKSHOP",discs:["ANY"],fx:"+3 Progress OR +3 Hype",special:"workshop",cost:{res:3},debt:0,phases:[0,1,2],mode:"single",note:"Spend any 3 skills"},
 {id:"fundraise",row:"FUNDRAISE",discs:["ANY"],fx:"+5G, -1 Culture",debt:0,phases:[2,3],mode:"single",note:"Cash now, Culture later"},
 {id:"crunch",  row:"CRUNCH",    discs:["ANY"],fx:"+2 Progress, -1 Culture",debt:1,phases:[1],mode:"shared"}
];

/* ---------- SYSTEM TILES (extracted from PDF) ---------- */
D.systems = [{"name":"Unit Tests","cat":"Stability","build":"4M+Eng+QA","trig":"1 QA","fx":"-2 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Bug Tracker","cat":"Stability","build":"3M+QA+Des","trig":"1 QA","fx":"-1 Debt, +2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"QA Automation","cat":"Stability","build":"4M+QA+Eng","trig":"1 QA","fx":"-2 Debt, +1 Progress","once":null,"each":null,"debt":0,"vp":2,"syn":2,"sym":["hexagon","triangle"],"bt":2},{"name":"Test Coverage","cat":"Stability","build":"5M+QA+Eng","trig":"1 QA","fx":"-3 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":2,"syn":2,"sym":["hexagon"],"bt":2},{"name":"Design Docs","cat":"Stability","build":"3M+Des","trig":"1 Des","fx":"-1 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon","square"],"bt":1},{"name":"Code Review","cat":"Stability","build":"4M+Eng+Des","trig":"1 Eng","fx":"-2 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Tech Spec","cat":"Stability","build":"3M+Eng+Des","trig":"1 Eng","fx":"-1 Debt, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon","triangle"],"bt":1},{"name":"Style Guide","cat":"Stability","build":"3M+Art+Des","trig":"1 Art","fx":"-1 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","hexagon"],"bt":1},{"name":"Sprint Planning","cat":"Stability","build":"3M+Des+DATA","trig":"1 Des","fx":"-1 Debt, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Retrospectives","cat":"Stability","build":"3M+Des+PX","trig":"1 PX","fx":"+2 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square"],"bt":1},{"name":"Onboarding","cat":"Stability","build":"3M+PX+Des","trig":"1 PX","fx":"Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square"],"bt":1},{"name":"Knowledge Base","cat":"Stability","build":"3M+Des+DATA","trig":"1 Des","fx":"-1 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","hexagon"],"bt":1},{"name":"CI/CD Pipeline","cat":"Stability","build":"4M+Eng+QA","trig":"1 Eng","fx":"-2 Debt, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":2,"syn":2,"sym":["triangle","hexagon"],"bt":2},{"name":"Version Control","cat":"Stability","build":"4M+Eng","trig":"1 Eng","fx":"+1 Culture, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":1},{"name":"Staging Env","cat":"Stability","build":"4M+Eng+QA","trig":"1 QA","fx":"-2 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Backup Systems","cat":"Stability","build":"3M+Eng+DATA","trig":"1 Eng","fx":"-1 Debt, +2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":1},{"name":"Rollback System","cat":"Stability","build":"4M+Eng+QA","trig":"1 Eng","fx":"-2 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":2,"syn":2,"sym":["triangle","hexagon"],"bt":2},{"name":"Security Audit","cat":"Stability","build":"4M+QA+Eng","trig":"1 QA","fx":"-2 Debt, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon","circle"],"bt":1},{"name":"Load Testing","cat":"Stability","build":"3M+Eng+DATA","trig":"1 Eng","fx":"-1 Debt, +1 Progress","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["circle","hexagon"],"bt":1},{"name":"Memory Manager","cat":"Stability","build":"4M+Eng+QA","trig":"1 Eng","fx":"-2 Debt, +1 Progress","once":null,"each":null,"debt":0,"vp":2,"syn":1,"sym":["triangle"],"bt":2},{"name":"Error Handling","cat":"Stability","build":"3M+Eng+QA","trig":"1 Eng","fx":"-1 Debt, +2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Crash Reporter","cat":"Stability","build":"3M+QA+DATA","trig":"1 QA","fx":"-1 Debt, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["hexagon"],"bt":1},{"name":"Discord Server","cat":"Reach","build":"4M+PX+Des","trig":"1 PX","fx":"+1 Hype, +1 Marketing, +1 Cult","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square"],"bt":1},{"name":"Beta Program","cat":"Reach","build":"3M+PX+QA","trig":"1 PX","fx":"+2 Hype, -1 Debt","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","hexagon"],"bt":1},{"name":"Influencer Net","cat":"Reach","build":"5M+Adv","trig":"1 Adv","fx":null,"once":"+3 Hype","each":"+2 Hype, +1 Marketing","debt":0,"vp":2,"syn":2,"sym":["oval"],"bt":2},{"name":"Ad Campaign","cat":"Reach","build":"4M+Adv","trig":"1 Adv","fx":"+2 Hype, +1 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["oval"],"bt":1},{"name":"Press Relations","cat":"Reach","build":"4M+Adv+PX","trig":"1 Adv","fx":null,"once":"+2 Hype","each":"+1 Hype, +1 Marketing","debt":0,"vp":1,"syn":1,"sym":["oval"],"bt":1},{"name":"Review Copies","cat":"Reach","build":"4M+Adv+QA","trig":"1 Adv","fx":"+2 Hype, +1 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["oval","hexagon"],"bt":1},{"name":"Trailer Studio","cat":"Reach","build":"5M+Art+Adv","trig":"1 Art","fx":null,"once":"+3 Hype, +1 Marketing","each":"+2 Hype, +1 Marketing","debt":0,"vp":2,"syn":2,"sym":["diamond","oval"],"bt":2},{"name":"Press Kit","cat":"Reach","build":"4M+Art+Adv","trig":"1 Art","fx":"+2 Hype, +1 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","oval"],"bt":1},{"name":"Brand Guide","cat":"Reach","build":"4M+Art+Des","trig":"1 Art","fx":"+2 Hype, +1 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","oval"],"bt":1},{"name":"Merch Store","cat":"Reach","build":"3M+Art+PX","trig":"1 Art","fx":"+1 Hype, +2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","square"],"bt":1},{"name":"Stealth Mode","cat":"Reach","build":"3M+Des","trig":"1 Des","fx":"-2 Hype, +3 Progress","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":1},{"name":"Delay Announce","cat":"Reach","build":"2M+PX","trig":"1 PX","fx":"-3 Hype, +5G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["oval"],"bt":1},{"name":"Launch Event","cat":"Reach","build":"7M+Adv+PX","trig":"1 Adv","fx":null,"once":"+4 Hype, +2 Marketing","each":"+3 Hype, +2 Marketing","debt":0,"vp":2,"syn":2,"sym":["oval"],"bt":3},{"name":"Viral Campaign","cat":"Reach","build":"5M+Adv+DATA","trig":"1 Adv","fx":null,"once":"+3 Hype","each":"+2 Hype, +1 Marketing","debt":0,"vp":2,"syn":2,"sym":["oval","circle"],"bt":2},{"name":"Demo Build","cat":"Reach","build":"5M+Eng+PX","trig":"1 Eng","fx":"-1 Debt, +3 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","hexagon"],"bt":2},{"name":"Creator Program","cat":"Reach","build":"5M+PX+Adv","trig":"1 PX","fx":"+2 Hype, +2 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","oval"],"bt":2},{"name":"Patreon","cat":"Revenue","build":"3M+PX","trig":"1 PX","fx":"+2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square"],"bt":1},{"name":"Contract Work","cat":"Revenue","build":"4M+Eng","trig":"1 Eng","fx":"+2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":1},{"name":"Freelance Pool","cat":"Revenue","build":"4M+Art","trig":"1 Art","fx":"+2G","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond"],"bt":1},{"name":"Tech Licensing","cat":"Revenue","build":"2M+Eng+DATA","trig":"1 Eng","fx":"+1G per Innovation","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":1},{"name":"Asset Store","cat":"Revenue","build":"4M+Art+Des","trig":"1 Art","fx":"+2G, +1 Progress","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond"],"bt":1},{"name":"Merch Empire","cat":"Revenue","build":"2M+Art+PX","trig":"1 Art","fx":"+1G per Reach","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","oval"],"bt":1},{"name":"Early Access","cat":"Revenue","build":"4M+Eng+PX","trig":"1 PX","fx":"+5G, -2 Hype","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square"],"inc":1,"pas":"At Income each round: +1G","bt":2},{"name":"Crowdfunding","cat":"Revenue","build":"7M+PX+Adv","trig":"1 PX","fx":"+3G, +2 Hype","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","oval"],"bt":3},{"name":"Publisher Deal","cat":"Revenue","build":"7M+Adv+DATA","trig":"1 Adv","fx":"+6G, -1 Culture","once":null,"each":null,"debt":0,"vp":2,"syn":2,"sym":["oval"],"inc":1,"pas":"At Income each round: +1G","bt":3},{"name":"Consulting","cat":"Revenue","build":"5M+Des+DATA","trig":"1 Des","fx":"+2G, Draw 1 Milestone","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["triangle"],"bt":2},{"name":"Sponsorship","cat":"Revenue","build":"5M+Adv+PX","trig":"1 Adv","fx":"+2G, +1 Hype","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["oval"],"bt":2},{"name":"Investment","cat":"Revenue","build":"3M+DATA+Adv","trig":"1 DATA","fx":"+2G per Sr (max 6G)","once":null,"each":null,"debt":0,"vp":2,"syn":1,"sym":["triangle"],"bt":1},{"name":"DLC Pipeline","cat":"Revenue","build":"5M+Des+Art","trig":"1 Des","fx":"+2G, +1 Progress","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","triangle"],"bt":2},{"name":"Season Pass","cat":"Revenue","build":"5M+PX+Adv","trig":"1 PX","fx":"+2G, +1 Hype","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","oval"],"bt":2},{"name":"Premium Edition","cat":"Revenue","build":"5M+Art+Adv","trig":"1 Art","fx":"+2G, +1 Marketing","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","oval"],"bt":2},{"name":"Licensing IP","cat":"Revenue","build":"2M+Adv+DATA","trig":"1 Adv","fx":"+1G per Stability","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["oval","hexagon"],"bt":1},{"name":"Tournament Fees","cat":"Revenue","build":"4M+PX+DATA","trig":"1 PX","fx":"+2G, +2 Hype","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["square","circle"],"bt":1},{"name":"Supporter Packs","cat":"Revenue","build":"4M+Art+PX","trig":"1 Art","fx":"+2G, +1 Culture","once":null,"each":null,"debt":0,"vp":1,"syn":1,"sym":["diamond","square"],"bt":1},{"name":"Game Engine","cat":"Innovation","build":"5M+Eng","trig":"1 Eng","fx":"+2 Progress","each":null,"debt":4,"vp":2,"syn":2,"sym":["triangle"],"pas":"Your Engineers get +2 Progress on any spot that gives Progress","rule":{"as":["ENG"],"if":"prod","gain":{"prod":2}},"once":null,"bt":3},{"name":"Level Editor","cat":"Innovation","build":"4M+Des","trig":"1 Des","fx":"+1 Progress","each":null,"debt":2,"vp":1,"syn":1,"sym":["triangle","diamond"],"pas":"Your Designers get +1 Progress on any spot that gives Progress","rule":{"as":["DES"],"if":"prod","gain":{"prod":1}},"once":null,"bt":2},{"name":"Asset Pipeline","cat":"Innovation","build":"4M+Art","trig":"1 Art","fx":"+1 Progress","each":null,"debt":2,"vp":1,"syn":1,"sym":["diamond"],"pas":"Your Artists get +1 Progress on any spot that gives Progress","rule":{"as":["ART"],"if":"prod","gain":{"prod":1}},"once":null,"bt":2},{"name":"Build System","cat":"Innovation","build":"3M+Eng","trig":"1 Eng","fx":"-1 Debt","each":null,"debt":1,"vp":1,"syn":1,"sym":["triangle","hexagon"],"pas":"Your Engineers add no Tech Debt from the spot they are placed on","rule":{"nodebt":true,"as":["ENG"]},"once":null,"bt":1},{"name":"Debug Tools","cat":"Innovation","build":"3M+QA","trig":"1 QA","fx":"-2 Debt","each":null,"debt":1,"vp":1,"syn":1,"sym":["hexagon"],"pas":"Your QA remove 1 extra Debt on any spot that removes Debt","rule":{"as":["QA"],"if":"-debt","gain":{"debt":-1}},"once":null,"bt":1},{"name":"Analytics SDK","cat":"Innovation","build":"3M+DATA","trig":"1 DATA","fx":"Draw 2 Keep 1","each":null,"debt":1,"vp":1,"syn":1,"sym":["circle"],"pas":"Your Analytics workers get +1 Marketing wherever placed","rule":{"as":["DATA"],"gain":{"mktg":1}},"once":null,"bt":1},{"name":"Modding Tools","cat":"Innovation","build":"4M+PX","trig":"1 PX","fx":"+2 Hype","each":null,"debt":2,"vp":1,"syn":1,"sym":["square","triangle"],"pas":"Your Community and Advertising workers get +1 Hype on any spot that gives Hype","rule":{"as":["PX","ADV"],"if":"hype","gain":{"hype":1}},"once":null,"bt":2},{"name":"Localization","cat":"Innovation","build":"4M+Adv","trig":"1 Adv","fx":"+1 Marketing, +1 Hype","each":null,"debt":2,"vp":1,"syn":1,"sym":["diamond","circle"],"pas":"Your Advertising workers get +1 Marketing on any spot that gives Marketing","rule":{"as":["ADV"],"if":"mktg","gain":{"mktg":1}},"once":null,"bt":2},{"name":"Cross-Platform","cat":"Innovation","build":"4M+Eng","trig":"1 Eng","fx":"+3 Progress","each":null,"debt":3,"vp":2,"syn":2,"sym":["triangle","circle"],"pas":"In Launch, all your workers get +1 Progress on any spot that gives Progress","rule":{"if":"prod","phase":3,"gain":{"prod":1}},"once":null,"bt":2},{"name":"Accessibility","cat":"Innovation","build":"4M+Des","trig":"1 Des","fx":"+2 Progress, +1 Culture","each":null,"debt":2,"vp":1,"syn":1,"sym":["hexagon"],"pas":"At the end of every round, +1 Culture","rule":{"upk":{"culture":1}},"once":null,"bt":2},{"name":"Perf Profiler","cat":"Innovation","build":"3M+QA","trig":"1 QA","fx":"-2 Debt","each":null,"debt":1,"vp":1,"syn":1,"sym":["triangle","hexagon"],"pas":"At the end of every round, remove 1 Tech Debt","rule":{"upk":{"debt":-1}},"once":null,"bt":1},{"name":"Hot Reload","cat":"Innovation","build":"3M+Eng","trig":"1 Eng","fx":"+2 Progress","each":null,"debt":3,"vp":1,"syn":1,"sym":["triangle"],"pas":"Each time you place an Engineer, +1 Code","rule":{"as":["ENG"],"gain":{"code":1}},"once":null,"bt":1},{"name":"Plugin System","cat":"Innovation","build":"4M+DATA","trig":"1 DATA","fx":"+2G","each":null,"debt":2,"vp":1,"syn":1,"sym":["triangle"],"pas":"Your worker on Outsource earns +2 Gold more","rule":{"rows":["OUTSOURCE"],"gain":{"gold":2}},"once":null,"bt":2},{"name":"Audio Engine","cat":"Innovation","build":"3M+Art","trig":"1 Art","fx":"+1 Progress OR +1 Marketing","each":null,"debt":1,"vp":1,"syn":1,"sym":["diamond"],"pas":"Your Artists get +1 Culture on any spot that gives Culture","rule":{"as":["ART"],"if":"culture","gain":{"culture":1}},"once":null,"bt":1}];

/* ---------- MILESTONES (hand of 3; cash in when requirement met) ---------- */
D.publisherGates = [
  { phase:0, name:"Concept Approval", pts:3, reqs:["3+ Progress"], fund:4, vp:0, penalty:1, flavor:"The publisher wants to see a working concept before releasing funds." },
  { phase:1, name:"Alpha Review", pts:5, reqs:["23+ Progress","Debt < 30%"], fund:6, vp:0, penalty:2, flavor:"Alpha build due. The publisher checks that it plays and isn't falling apart." },
  { phase:2, name:"Beta Review", pts:7, reqs:["33+ Progress","8+ Hype"], fund:8, vp:0, penalty:3, flavor:"Beta due. Marketing needs a game to show and the buzz to sell it." },
  { phase:3, name:"Gold Master", pts:10, reqs:["37+ Progress","Debt < 15%"], fund:0, vp:5, penalty:4, flavor:"Ship it. The publisher signs off on the final build." }
];

/* Gate pool: at the end of round 1 one gate per phase is drawn from here (config gatesRandom). The standard four are the first option of each phase. */
D.gatePool = [
  { phase:0, name:"Concept Approval", pts:3, reqs:["3+ Progress"], fund:4, vp:0, penalty:1, flavor:"The publisher wants to see a working concept before releasing funds." },
  { phase:0, name:"Pitch Deck", pts:3, reqs:["2+ Progress","1+ Marketing value"], fund:4, vp:0, penalty:1, flavor:"Show the publisher something they can get excited about." },
  { phase:0, name:"Studio Check", pts:3, reqs:["3+ Progress","+0 Culture"], fund:4, vp:0, penalty:1, flavor:"The publisher wants a team that is still talking to each other." },
  { phase:0, name:"Tech Demo", pts:3, reqs:["2+ Progress","Debt < 90%"], fund:4, vp:0, penalty:1, flavor:"A rough demo is fine, a broken one is not." },
  { phase:1, name:"Alpha Review", pts:5, reqs:["24+ Progress","Debt < 30%"], fund:6, vp:0, penalty:2, flavor:"Alpha build due. The publisher checks that it plays and isn't falling apart." },
  { phase:1, name:"Vertical Slice", pts:5, reqs:["20+ Progress","1+ Innovation systems"], fund:6, vp:0, penalty:2, flavor:"One polished slice that proves the idea is new." },
  { phase:1, name:"Playtest Report", pts:5, reqs:["20+ Progress","7+ Hype"], fund:6, vp:0, penalty:2, flavor:"Players are talking about the build. The publisher wants to hear it." },
  { phase:1, name:"Stability Audit", pts:5, reqs:["12+ Progress","1+ Stability systems","Debt < 40%"], fund:6, vp:0, penalty:2, flavor:"The publisher sends auditors to check how solid the foundations are." },
  { phase:1, name:"Investor Demo", pts:5, reqs:["15+ Progress","10+ Marketing value"], fund:6, vp:0, penalty:2, flavor:"Investors visit. Progress and a story to tell." },
  { phase:2, name:"Beta Review", pts:7, reqs:["33+ Progress","8+ Hype"], fund:8, vp:0, penalty:3, flavor:"Beta due. Marketing needs a game to show and the buzz to sell it." },
  { phase:2, name:"Feature Complete", pts:7, reqs:["24+ Progress","4+ total systems built"], fund:8, vp:0, penalty:3, flavor:"Every planned feature is in. Now it just has to work." },
  { phase:2, name:"Marketing Beat", pts:7, reqs:["22+ Progress","16+ Marketing value"], fund:8, vp:0, penalty:3, flavor:"The publisher books the ad campaign. Is there a game to advertise?" },
  { phase:2, name:"Cert Pre-check", pts:7, reqs:["31+ Progress","Debt < 25%"], fund:8, vp:0, penalty:3, flavor:"Console certification is strict about crashes." },
  { phase:2, name:"Community Build", pts:7, reqs:["26+ Progress","+1 Culture","6+ Hype"], fund:8, vp:0, penalty:3, flavor:"A happy team and a growing community." },
  { phase:3, name:"Gold Master", pts:10, reqs:["37+ Progress","Debt < 15%"], fund:0, vp:5, penalty:4, flavor:"Ship it. The publisher signs off on the final build." },
  { phase:3, name:"Launch Ready", pts:10, reqs:["35+ Progress","12+ Hype"], fund:0, vp:5, penalty:4, flavor:"Launch day. The hype has to be there." },
  { phase:3, name:"Day-One Build", pts:10, reqs:["32+ Progress","4+ total systems built"], fund:0, vp:5, penalty:4, flavor:"A complete, systems-rich game on day one." },
  { phase:3, name:"Press Kit", pts:10, reqs:["30+ Progress","17+ Marketing value"], fund:0, vp:5, penalty:4, flavor:"The press wants a story and a build to match." },
  { phase:3, name:"Certification", pts:10, reqs:["35+ Progress","Debt < 20%","+0 Culture"], fund:0, vp:5, penalty:4, flavor:"Final certification. Clean build, healthy team." }
];
D.milestones = [{"cat": "Workforce", "gold": 4, "name": "First Promotion", "text": "Promote your first Jr worker to Sr"}, {"cat": "Workforce", "gold": 5, "name": "Specialist Team", "text": "Have 3+ workers of the SAME discipline"}, {"cat": "Workforce", "gold": 3, "name": "Balanced Studio", "text": "Have at least 1 Dev AND 1 Marketing discipline"}, {"cat": "Workforce", "gold": 6, "name": "Exactly Five", "text": "Have EXACTLY 5 workers (no more, no less)"}, {"cat": "Workforce", "gold": 4, "name": "Lean Operation", "text": "Complete a round placing only 2 workers"}, {"cat": "Workforce", "gold": 7, "name": "All-Star Team", "text": "Have 3 or more Sr workers"}, {"cat": "Workforce", "gold": 5, "name": "Hiring Spree", "text": "Hire 3+ workers in a single round"}, {"cat": "Workforce", "gold": 5, "name": "Diverse Perspectives", "text": "Have 4+ different disciplines on your team"}, {"cat": "Workforce", "gold": 3, "name": "Growing Pains", "text": "Fire a worker for the first time"}, {"cat": "Workforce", "gold": 6, "name": "Mentor Program", "text": "Have exactly 2 Jr and 2 Sr workers"}, {"cat": "Economy", "gold": 5, "name": "Budget Conscious", "text": "End a round with exactly 0 Gold"}, {"cat": "Economy", "gold": 4, "name": "Savings Account", "text": "Accumulate 15+ Gold at once"}, {"cat": "Economy", "gold": 4, "name": "Big Spender", "text": "Spend 10+ Gold in a single round"}, {"cat": "Economy", "gold": 5, "name": "Gold Rush", "text": "Gain 8+ Gold in a single round"}, {"cat": "Economy", "gold": 6, "name": "Investment Return", "text": "Trigger 3+ systems in a single round"}, {"cat": "Economy", "gold": 4, "name": "Efficient Engine", "text": "Build a system costing 5+ skills"}, {"cat": "Economy", "gold": 5, "name": "Production Surge", "text": "Spend 6+ skills in a single round"}, {"cat": "Economy", "gold": 7, "name": "Bootstrapped", "text": "Build 3 systems without using Gold costs"}, {"cat": "Economy", "gold": 4, "name": "Liquidation", "text": "Sell/discard 2+ Milestones in one round"}, {"cat": "Economy", "gold": 5, "name": "Perfect Timing", "text": "Cash in 2 Milestones in a single round"}, {"cat": "Development", "gold": 3, "name": "Foundation", "text": "Build your first system"}, {"cat": "Development", "gold": 6, "name": "Category Focus", "text": "Build 3 systems of the SAME category"}, {"cat": "Development", "gold": 5, "name": "Balanced Build", "text": "Have at least 1 system in 3+ categories"}, {"cat": "Development", "gold": 8, "name": "Quality First", "text": "Reduce Tech Debt to exactly 0"}, {"cat": "Development", "gold": 4, "name": "Tech Debt Accepted", "text": "Have exactly 5 Tech Debt"}, {"cat": "Development", "gold": 6, "name": "Rapid Prototype", "text": "Build 2 systems in a single round"}, {"cat": "Development", "gold": 5, "name": "Progress Push", "text": "Reach 20+ Progress"}, {"cat": "Development", "gold": 5, "name": "Feature Complete", "text": "Build your 5th system"}, {"cat": "Development", "gold": 7, "name": "System Architect", "text": "Build your 8th system"}, {"cat": "Development", "gold": 5, "name": "Debt Recovery", "text": "Remove 3+ Tech Debt in a single round"}, {"cat": "Marketing", "gold": 5, "name": "Going Viral", "text": "Reach 15+ Hype for the first time"}, {"cat": "Marketing", "gold": 4, "name": "Hype Train", "text": "Gain 5+ Hype in a single round"}, {"cat": "Marketing", "gold": 4, "name": "Stealth Launch", "text": "Have exactly 0 Hype"}, {"cat": "Marketing", "gold": 5, "name": "Marketing Push", "text": "Reach 20+ Marketing value"}, {"cat": "Marketing", "gold": 5, "name": "Influencer Network", "text": "Build 2+ Reach systems"}, {"cat": "Marketing", "gold": 6, "name": "Community Built", "text": "Have 3+ PX or Community workers"}, {"cat": "Marketing", "gold": 5, "name": "Ad Blitz", "text": "Spend 8+ Gold on Reach systems (cumulative)"}, {"cat": "Marketing", "gold": 7, "name": "Peak Hype", "text": "Reach 30+ Hype"}, {"cat": "Marketing", "gold": 6, "name": "Sustained Buzz", "text": "Maintain 10+ Hype for 3 consecutive rounds"}, {"cat": "Marketing", "gold": 6, "name": "Market Leader", "text": "Have highest Marketing value among all players"}];

/* ---------- OBJECTIVES (scored at end of game) ---------- */
D.objectives = [{"type":"Platform","vp":6,"name":"PC Master Race","reqs":["12+ Progress","1+ Innovation systems","2+ Engineer workers"],"sym":["triangle","square"],"res":"code"},{"type":"Platform","vp":6,"name":"Steam Domination","reqs":["15+ Progress","2+ Engineer workers","1+ Analytics workers"],"sym":["triangle","square"],"res":"code"},{"type":"Platform","vp":7,"name":"Console Ready","reqs":["22+ Progress","2+ Stability systems","Debt < 15%"],"sym":["hexagon","triangle"],"res":"code"},{"type":"Platform","vp":7,"name":"Platform Exclusive","reqs":["25+ Progress","2+ Stability systems","20+ Hype"],"sym":["hexagon","oval"],"res":"code"},{"type":"Platform","vp":5,"name":"Mobile First","reqs":["12+ Marketing value","2+ Analytics workers","15+ Hype"],"sym":["oval","circle"],"res":"process"},{"type":"Platform","vp":5,"name":"App Store Featured","reqs":["12+ Marketing value","2+ Community workers","8+ Hype"],"sym":["oval","square"],"res":"buzz"},{"type":"Platform","vp":6,"name":"VR Pioneer","reqs":["12+ Progress","2+ Art workers","1+ Design workers"],"sym":["diamond","triangle"],"res":"ideas"},{"type":"Platform","vp":6,"name":"Immersive Experience","reqs":["15+ Progress","1+ Innovation systems","2+ Art workers"],"sym":["diamond","triangle"],"res":"ideas"},{"type":"Platform","vp":7,"name":"Cross-Platform","reqs":["25+ Progress","1+ systems each category"],"sym":["triangle","circle"],"res":"process"},{"type":"Platform","vp":7,"name":"Cloud Gaming","reqs":["22+ Progress","18+ Marketing value","2+ DATA workers"],"sym":["circle","triangle"],"res":"process"},{"type":"Platform","vp":5,"name":"Retro Revival","reqs":["18+ Progress","18+ Hype","+3 Culture"],"sym":["diamond","square"],"res":"buzz"},{"type":"Platform","vp":6,"name":"Early Access King","reqs":["15+ Progress","12+ Hype","2+ PX workers"],"sym":["square","oval"],"res":"buzz"},{"type":"Genre","vp":6,"name":"Action Game","reqs":["15+ Progress","2+ Engineer workers","1+ Art workers"],"sym":["triangle","diamond"],"res":"code"},{"type":"Genre","vp":7,"name":"Action Blockbuster","reqs":["22+ Progress","2+ Engineer workers","2+ Art workers"],"sym":["triangle","diamond"],"res":"code"},{"type":"Genre","vp":6,"name":"Strategy Game","reqs":["18+ Progress","2+ Design workers","1+ Analytics workers"],"sym":["triangle","hexagon"],"res":"ideas"},{"type":"Genre","vp":7,"name":"Tactical Masterpiece","reqs":["20+ Progress","2+ Design workers","1+ Analytics worker"],"sym":["triangle","hexagon"],"res":"ideas"},{"type":"Genre","vp":7,"name":"RPG Epic","reqs":["24+ Progress","2+ Design workers","2+ Art workers"],"sym":["diamond","square"],"res":"ideas"},{"type":"Genre","vp":7,"name":"Fantasy Adventure","reqs":["20+ Progress","2+ Design workers","2+ Art workers"],"sym":["diamond","square"],"res":"ideas"},{"type":"Genre","vp":5,"name":"Puzzle Game","reqs":["12+ Progress","3+ Design workers","Debt < 20%"],"sym":["hexagon","diamond"],"res":"ideas"},{"type":"Genre","vp":6,"name":"Brain Teaser","reqs":["18+ Progress","2+ Analytics workers","Debt < 10%"],"sym":["hexagon","triangle"],"res":"process"},{"type":"Genre","vp":6,"name":"Horror Game","reqs":["15+ Progress","2+ Art workers","10+ Hype"],"sym":["diamond","hexagon"],"res":"ideas"},{"type":"Genre","vp":7,"name":"Survival Horror","reqs":["22+ Progress","2+ Art workers","25+ Hype"],"sym":["diamond","square"],"res":"ideas"},{"type":"Genre","vp":6,"name":"Indie Darling","reqs":["18+ Progress","+3 Culture","Debt < 5%"],"sym":["square","diamond"],"res":"process"},{"type":"Genre","vp":6,"name":"Sim Game","reqs":["20+ Progress","3+ Design workers","2+ DATA workers"],"sym":["triangle","hexagon"],"res":"ideas"},{"type":"Audience","vp":5,"name":"Casual Hit","reqs":["20+ Marketing value","20+ Hype","2+ PX workers"],"sym":["oval","square"],"res":"buzz"},{"type":"Audience","vp":7,"name":"Viral Sensation","reqs":["18+ Marketing value","20+ Hype","2+ PX workers"],"sym":["oval","circle"],"res":"buzz"},{"type":"Audience","vp":7,"name":"Hardcore Favorite","reqs":["20+ Progress","10+ Hype","2+ QA workers"],"sym":["hexagon","triangle"],"res":"code"},{"type":"Audience","vp":7,"name":"Esports Ready","reqs":["25+ Progress","22+ Marketing value","2+ DATA workers"],"sym":["circle","hexagon"],"res":"process"},{"type":"Audience","vp":7,"name":"Streamer Bait","reqs":["15+ Progress","25+ Marketing value","3+ Adv workers"],"sym":["oval","square"],"res":"buzz"},{"type":"Audience","vp":6,"name":"Community Driven","reqs":["25+ Progress","22+ Marketing value","+3 Culture"],"sym":["square","hexagon"],"res":"buzz"},{"type":"Audience","vp":7,"name":"AAA Quality","reqs":["32+ Progress","20+ Marketing value","Debt < 15%"],"sym":["hexagon","triangle"],"res":"buzz"},{"type":"Audience","vp":5,"name":"Kids & Family","reqs":["22+ Progress","18+ Marketing value","+3 Culture"],"sym":["diamond","square"],"res":"buzz"},{"type":"Audience","vp":6,"name":"Niche Classic","reqs":["20+ Progress","10+ Hype","3+ Design workers"],"sym":["diamond","square"],"res":"ideas"},{"type":"Audience","vp":7,"name":"Mass Market","reqs":["20+ Progress","30+ Marketing value","20+ Hype"],"sym":["oval","circle"],"res":"buzz"},{"type":"Audience","vp":5,"name":"Cult Following","reqs":["15+ Progress","15+ Hype","3+ Art workers"],"sym":["square","diamond"],"res":"ideas"},{"type":"Audience","vp":7,"name":"Critical Acclaim","reqs":["28+ Progress","Debt < 12%","+3 Culture"],"sym":["hexagon","diamond"],"res":"process"},{"type":"Wild","vp":6,"name":"Speed Run","reqs":["20+ Hype at Launch","22+ Progress"],"sym":["triangle"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Perfectionist","reqs":["Debt < 5%","20+ Progress"],"sym":["hexagon"],"res":"process"},{"type":"Wild","vp":7,"name":"Marketing Machine","reqs":["30+ Marketing value","25+ Hype at Launch"],"sym":["oval"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Progress Visionary","reqs":["32+ Progress","Debt < 25%"],"sym":["triangle","diamond"],"res":"process"},{"type":"Wild","vp":7,"name":"Balanced Portfolio","reqs":["25+ Progress","25+ Marketing","25+ Hype"],"sym":["hexagon","oval"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Efficiency Expert","reqs":["25+ Progress","5 or fewer workers"],"sym":["triangle"],"res":"process"},{"type":"Wild","vp":7,"name":"System Master","reqs":["6+ total systems built","20+ Progress"],"sym":["triangle","hexagon"],"res":"process"},{"type":"Wild","vp":7,"name":"Cultural Icon","reqs":["+5 Culture","20+ Hype","15+ Marketing value"],"sym":["square","oval"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Tech Pioneer","reqs":["2+ Innovation systems","22+ Progress"],"sym":["triangle"],"res":"ideas"},{"type":"Wild","vp":7,"name":"Launch Ready","reqs":["Debt < 10%","25+ Hype","25+ Progress"],"sym":["hexagon","oval"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Market Dominator","reqs":["Highest Progress Share %","Highest Marketing Share %"],"sym":["oval","circle"],"res":"buzz"},{"type":"Wild","vp":7,"name":"Dream Team","reqs":["6+ Sr workers","+4 Culture","22+ Progress"],"sym":["square","hexagon"],"res":"process"}];

/* ---------- CRISIS CARDS (3 phase decks) ----------
   deck: 0 = Pre->Production (blue), 1 = Production->Polish (orange), 2 = Polish->Launch (pink)
   kind: effect | choice | auction. Behaviour is in Engine.CRISIS[id]. Text is editable. */
D.crisis = [
 {id:"investor",deck:0,name:"Investor Pressure",kind:"effect",flavor:"Your early pitch generated buzz. Investors want proof of progress.",
  text:"All players must have at least 5 Progress by the end of the Production phase OR lose 5 VP. Reward: first player to reach 10 Progress gains +3 VP immediately.", poolText:"All players must have at least 5 Progress by the end of the Production phase OR lose 5 Progress points. Reward: first player to reach 10 Progress gains +3 Progress points immediately.",
  params:{need:5,penalty:5,firstAt:10,reward:3}},
 {id:"talentwar",deck:0,name:"Talent War",kind:"effect",flavor:"Competing studios are recruiting aggressively.",
  text:"Hiring costs +1G for the entire Production phase. Players with positive Culture (+1 or better) ignore this.",params:{add:1,protect:1}},
 {id:"platform",deck:0,name:"Platform Shift",kind:"choice",flavor:"Industry trends are changing rapidly.",
  text:"Each player chooses: A) Stay the course. B) Pivot: draw 1 new Platform objective, replace your Platform or keep both. C) Hedge: +2 Marketing, -1 Culture.",
  options:[{k:"A",label:"Stay the course"},{k:"B",label:"Pivot (new Platform objective)"},{k:"C",label:"Hedge bets (+2 Marketing, -1 Culture)"}]},
 {id:"earlyaccess",deck:0,name:"Early Access Offer",kind:"auction",flavor:"A publisher offers early funding for exclusivity.",
  text:"All players secretly bid Gold. Winner pays their bid and gains +8 Gold and +2 Hype. 2nd highest bid: +2 Gold consolation. Others keep their gold.",
  params:{winGold:8,winHype:2,secondGold:2}},
 {id:"raid",deck:0,name:"Studio Raid",kind:"choice",flavor:"A competitor is shutting down. Their talent is available.",
  text:"In turn order, each player may hire 1 worker from the released-worker pile at HALF cost (Jr 1G, Sr 2G). Workers enter Active.",
  options:[{k:"hire",label:"Hire a released worker (half cost)"},{k:"skip",label:"Pass"}]},
 {id:"creep",deck:1,name:"Feature Creep",kind:"choice",flavor:"Your ambitions grew during development.",
  text:"Each player chooses: A) Stay focused. B) Add features: +3 Progress and +5 Debt. C) Cut scope: -2 Hype and -3 Debt. D) Delay refinement: +2 Progress but cannot use the Mentor spot during Polish.",
  options:[{k:"A",label:"Stay focused"},{k:"B",label:"Add features (+3 Progress, +5 Debt)"},{k:"C",label:"Cut scope (-2 Hype, -3 Debt)"},{k:"D",label:"Delay refinement (+2 Progress, no Mentor in Polish)"}]},
 {id:"departure",deck:1,name:"Key Employee Departure",kind:"effect",flavor:"Someone left for a competitor.",
  text:"Each player with negative Culture (-1 or worse) immediately loses 1 Sr worker of their choice. Lost workers leave the game."},
 {id:"conference",deck:1,name:"Industry Conference",kind:"effect",flavor:"Major gaming expo. Time to show your game.",
  text:"At the end of the current round compare Marketing. Most: +3 Hype. 2nd: +1 Hype. Ties split (round down). Least Marketing: +1 Culture.",
  params:{first:3,second:1,last:1}},
 {id:"breakthrough",deck:1,name:"Tech Breakthrough",kind:"auction",flavor:"New tools could revolutionize your workflow.",
  text:"All players secretly bid Gold. Winner pays their bid and may build 1 FREE system during the next Build step (ignores Momentum cost; still needs workers)."},
 {id:"burnout",deck:1,name:"Burnout Wave",kind:"effect",flavor:"Long hours are taking their toll.",
  text:"Players with 3+ Over-Tired workers lose 1 worker (their choice). Players with 6+ Tired workers: -1 Culture. Players with positive Culture lose no workers.",
  params:{overTired:3,tired:6}},
 {id:"bug",deck:2,name:"Last-Minute Bug",kind:"choice",flavor:"QA found a critical issue in the production build.",
  text:"The player(s) with MOST Tech Debt choose: A) Emergency fix: pay 8 Gold and lose 1 worker. B) Ship anyway: launch threshold penalties are DOUBLED. C) Delay: skip all worker placement in Round 12.",
  options:[{k:"A",label:"Emergency fix (8G + lose 1 worker)"},{k:"B",label:"Ship anyway (penalties doubled)"},{k:"C",label:"Delay (skip Round 12 placement)"}]},
 {id:"viral",deck:2,name:"Viral Marketing Moment",kind:"auction",flavor:"A major streamer wants to showcase someone's game.",
  text:"All players secretly bid Gold. Winner pays their bid and gains +5 Hype. 2nd highest bidder gains +2 Hype (pays nothing).",
  params:{winHype:5,secondHype:2}},
 {id:"buyout",deck:2,name:"Publisher Buyout",kind:"choice",flavor:"A major publisher wants to acquire your studio.",
  text:"Each player may accept: immediately gain +15 VP but remove 2 Objectives from scoring (your choice). Or decline.", poolText:"Each player may accept: immediately gain +15 Progress points but remove 2 Objectives from scoring (your choice). Or decline.",
  options:[{k:"accept",label:"Accept (+15 VP, lose 2 objectives)", poolLabel:"Accept (+15 Progress pts, lose 2 objectives)"},{k:"decline",label:"Decline"}],params:{vp:15,remove:2}},
 {id:"award",deck:2,name:"Award Nomination",kind:"effect",flavor:"Your game is nominated for 'Most Anticipated'.",
  text:"At the end of the current round compare Hype. Most: +4 VP. 2nd: +2 VP. 3rd: +1 VP. Ties split (round down). VP is awarded now.", poolText:"At the end of the current round compare Hype. Most: +4 Hype points. 2nd: +2. 3rd: +1. Ties split (round down). Points are awarded now.",
  params:{v:[4,2,1]}},
 {id:"patch",deck:2,name:"Day-One Patch",kind:"choice",flavor:"You have 24 hours to fix critical issues.",
  text:"Each player may spend skills (any mix) for emergency fixes: 3 skills remove 2 Debt, 5 remove 4 Debt, 8 remove 7 Debt. Repeat as long as you have skills.",
  params:{fixes:[[3,2],[5,4],[8,7]]}}
];

/* ---------- DEFAULT CONFIG (every value is tunable in the Data Studio) ---------- */
D.config = {
  _meta:{
    varC:["Variant C rules on","1 = phase-shaped economy (C), 0 = original rules. Turns the rest of this group on or off"],
    spotResOr:["C: spots pay skills OR Hype/Progress","1 = a spot pays skills only if it has a skill multiplier; other spots pay Hype/Progress/utility only"],
    srSystems:["C: only Seniors trigger system tiles","1 = Juniors cannot be placed on built systems"],
    srPromoteOnly:["C: Seniors are promoted, not hired","1 = the hire step only offers Juniors"],
    promoFree:["C: promotion costs no Gold","1 = promoting a Junior is free"],
    promoNeedsRest:["C: promotion needs a rested worker","1 = the Junior must have worked before and sit out this round"],
    overworkCulture:["C: Culture when an Over-Tired worker is placed","Negative number = Culture lost each time"],
    recruitCost:["C: Recruitment cost (Gold)","Pay this to take a shared offer, no worker needed"],
    recruitPerRound:["C: hires per player per round","From the Recruitment pool"],
    recruitSize2:["C: Recruitment offers (2 players)","One discipline from each of this many categories"],
    recruitSize34:["C: Recruitment offers (3-4 players)",""],
    recruitSize56:["C: Recruitment offers (5-6 players)",""],
    noSwaps:["C: No objective or milestone swaps","1 = Community and Analytics workers cannot swap objectives or milestones mid-game (only crisis events change them)"],
    recruitInLaunch:["C: Recruitment in Launch","1 = allowed in the final round"],
    buildDelay:["C: normal build time (rounds)","A system you buy is finished this many rounds later"],
    crunchDelay:["C: rushed build time (rounds)","Rounds until finished when you crunch (pay Gold or tire a worker)"],
    crunchGold:["C: crunch cost (Gold)","Alternative to tiring a worker"],
    bidEveryRound:["C: turn-order bid every round","1 = a blind bid for turn order every round (not only at phase start). Every player pays their bid"],
    rdCrunch:["C: R&D rushes your build for free","1 = R&D crew gives a free crunch this round"],
    convertRate:["C: final-round conversion rate","Skills of the worker's own category needed for 1 Hype or Progress"],
    gateProgMult:["C: gate Progress multiplier","Scales every Progress number in the publisher gates"],
    gateHypeMult:["C: gate Hype / Marketing multiplier","Scales every Hype and Marketing number in the publisher gates"],
    rowNames:["C: board row names","Display names of the Earn, Progress, Hype, Crew and Utility groups for [Concept, Production, Polish, Launch]. Edit under Table values"],
    phaseEnds:["C: last round of each phase","[Concept, Production, Polish, Launch]. Edit under Table values"],
    startGold:["Starting Gold","Gold each player begins with"],
    income:["Income / round","Gold every player receives each round (v47: 5)"],
    srBuildDiscount:["Senior build discount","Gold off your next system build for each Senior placed this round (minimum cost 0)"],
    marketSize:["Systems market: face-up per type","How many systems of each type are available to buy at once. 0 = every unbuilt system is available"],
    marketRefreshGold:["Systems market: refresh cost","Gold to replace one face-up system with a new one"],
    marketRefreshesPerRound:["Systems market: refreshes per round","Per player"],
    headhuntCatchUp:["Headhunt catch-up rule","1 = you can only headhunt from a studio with more workers than yours"],
    gatesEnabled:["Publisher gates","1 = a review at the end of every phase (funding for passing, VP penalty for missing)"],
    gateBestVP:["Gate: favorite bonus","VP for the passing studio with the most Progress (no ties)"],
    maxSystems:["Max systems per studio","Total systems a studio can own across all types. 0 = no limit (only the per-type slots apply)"],
    reachFade:["Reach: Hype fade reduction","Each Reach system you own makes your Hype fade this much less each round (Hype fade itself is set by Hype decay)"],
    reachMajorVP:["Reach: Spotlight VP","VP for the player(s) with the most Reach systems (at least 2). 0 = off"],
    sysVPMult:["System VP multiplier","Multiplies the printed VP of every built system"],
    synergyMult:["Synergy VP multiplier","Multiplies synergy VP (systems matching a met objective)"],
    sysGoldMult:["System build: Gold per skill","Every system also costs Gold = total skill cost x this (rounded). 0 = skills only"],
    salaryJr:["Salary: Junior worker","Gold paid per Junior worker at the start of every round, right after Income"],
    salarySr:["Salary: Senior worker","Gold paid per Senior worker at the start of every round, right after Income"],
    jrCost:["Jr hire cost","Gold"],
    srCost:["Sr hire cost","Gold (Production / Launch)"],
    srCostPolish:["Sr hire cost (Polish)","Discount phase"],
    talentWarAdd:["-","(set by crisis card)"],
    discardGold:["Discard-card gold","Gold for discarding an unhired discipline card"],
    srAllowedPreProd:["Sr/promotion allowed in Pre-Production","1 = yes, 0 = no (rules: no Sr in Pre-Progress)"],
    qaAllowedPreProd:["QA allowed in Pre-Production","1 = yes, 0 = no (rules: no QA)"],
    resJr:["Skill: Jr placed","Skills earned when a Junior is placed (the skill of the role they fill)"],
    resSr:["Skill: Sr placed","Skills earned when a Senior is placed"],
    resOver:["Skill: Over-Tired worker","Skills earned by an Over-Tired worker"],
    resCap:["Skill cap (each type)","Most of each skill a studio can bank"],sysCostMult:["System cost multiplier","Multiplies every system skill cost (rounded, minimum 1). 1 = printed costs"],objVPMult:["Objective VP multiplier (Environment A)","Multiplies objective VP and partial objective VP"],crewPartnerCap:["Crew partner skill limit","Most skills each non-placing crew member earns (the placing worker earns the normal Junior or Senior amount)"],
    resSubGold:["Skill shortfall: Gold each","Gold paid for each missing skill unit when building"],
    resSubMax:["Skill shortfall: max units","Most missing skill units you can cover with Gold on one build. 0 = no covering"],
    srBonus:["Sr bonus on main board","+1 Progress OR +1 Marketing (amount)"],
    handSize:["Milestone hand size",""],
    objDraw:["Objectives: draw per type",""],
    objKeep:["Objectives: keep per type",""],
    buildsPerRound:["Systems buildable / round",""],
    rdDiscount:["R&D: skill discount","Your next system this round costs this many fewer skills (never below 1 in total). Gold cost follows the lower total"],
    gatesRandom:["Publisher gates: random each game","1 = one gate per phase is drawn from the gate pool at the end of round 1. 0 = always the four standard gates"],
    slotsPerCategory:["System slots per category",""],
    teamEventCulture:["Team Event: Culture gained",""],
    culMin:["Culture min",""],culMax:["Culture max",""],
    cultureDecay:["Culture decay / upkeep","Moves toward 0 by this amount"],
    hypeDecay:["Hype decay / upkeep",""],
    hypeCap:["Hype cap (for % scoring)",""],
    prodCap:["Progress cap (for Progress% in Delivery)","Progress% = Progress / cap  (rule gap #3 default)"],
    debtMode:["Debt % formula","1 = Debt / Progress, 0 = raw Debt points"],
    launchMult:["Launch spot multiplier","Printed Launch values already x2, so default 1"],
    promoCost0:["Promotion cost: Pre-Progress",""],promoCost1:["Promotion cost: Production",""],
    promoCost2:["Promotion cost: Polish",""],promoCost3:["Promotion cost: Launch",""],
    promotionsPerRest:["Promotions / Rest",""],
    headhuntMult:["Headhunt cost multiplier","x promotion cost"],
    headhuntComp:["Headhunt compensation","Fraction of price paid to victim (rounded down)"],
    headhuntsPerRest:["Headhunts / Rest",""],
    lossThreshBase:["Over-Tired loss: base die target","Lose worker if d6 <= base - floor(Culture/2)  (rule gap #2)"],
    crisisEnabled:["Crisis cards enabled","1/0"],
    draftPool:["Face-up pool size during the draft","Refills after every pick. 0 = deal exactly the picks, no refill. Drafting is free; hiring costs gold later"],
    draftPre2:["Workers each player drafts: Pre-Production, 2 players","Number of picks per player. Free to draft"],draftPre:["Workers each player drafts: Pre-Production, 3+ players","Number of picks per player. Free to draft"],
    draftProd2:["Workers each player drafts: Production, 2 players","Number of picks per player. Free to draft"],draftProd:["Workers each player drafts: Production, 3+ players","Number of picks per player. Free to draft"],
    draftPol2:["Workers each player drafts: Polish, 2 players","Number of picks per player. Free to draft"],draftPol:["Workers each player drafts: Polish, 3+ players","Number of picks per player. Free to draft"],
    draftLaunch:["Draft cards/player: Launch",""],
    scoreShareScale:["Market share VP scale","VP = share% x scale"],
    scoreShareNormalize:["Normalize share by player count","1 = scale by (players/4), 0 = off (gap #4)"],
    poolScoring:["Pool scoring (Environment B)","1 = Progress and Hype are zero-sum pools; systems, objectives, Gates and Reach feed them; Debt subtracts from Progress"],poolPot:["Pool VP per player per track","Fallback when no per-player-count value"],poolSysMult:["System VP to track points","Each printed system VP counts this many track points"],poolObjMult:["Objective VP to track points","Each objective VP counts this many track points"],poolDebtMult:["Debt to Progress","Each Debt subtracts this many Progress points"],
    raceScoring:["Race scoring","1 = Progress and Hype scored by rank; Debt (most loses most) and Culture (least loses most) as inverse ranks"],mktgToHype:["Marketing added to Hype at end","Marketing x this is added to Hype for the Hype race"],raceCurveByN:["Rank steepness by player count (C)","Overrides Rank table steepness for that player count. Lower = smaller VP jump between ranks, so fewer runaway gaps"],racePotByN:["Rank pot by player count (C)","Overrides VP per player per race track for that player count"],debtLossByN:["Most-Debt loss by player count (C)","Overrides Most-Debt VP loss for that player count"],cultLossByN:["Lowest-Culture loss by player count (C)","Overrides Lowest-Culture VP loss for that player count"],raceCurve:["Rank table steepness","0.5 = flat, 1 = linear, 2.5 = winner takes most"],racePot:["VP per player per race track","Total rank VP on each track = this x players"],debtLossMax:["Most-Debt VP loss","Worst Debt rank loses this; best loses 0"],cultLossMax:["Lowest-Culture VP loss","Lowest Culture loses this; best loses 0"],trackScoring:["Absolute tracks (older)","Unused when race scoring is on"],
    debtPenaltyMult:["Tech Debt penalty multiplier","VP lost = Debt% x mult"],
    debtPenaltyCap:["Tech Debt penalty cap",""],
    cleanThresh:["Clean launch below Debt %",""],stdThresh:["Standard up to Debt %",""],roughThresh:["Rough up to Debt %",""],
    cleanBonus:["Clean launch VP bonus",""],blockedPenalty:["Blocked launch VP penalty",""],roughHypeMult:["Rough launch Hype multiplier",""],
    goldPerVP:["Gold per 1 VP",""],
    deliveredBonus:["Delivery: delivered VP",""],
    synergyOn:["Synergy scoring on","1/0"]
  },
  startGold:15, income:4, salaryJr:1, salarySr:2, sysGoldMult:0.75, reachFade:1, maxSystems:6, marketSize:2, marketRefreshGold:1, marketRefreshesPerRound:1, headhuntCatchUp:1, gateLossCap:3, objPartial:1, gateContract:1, gatesEnabled:1, gateBestVP:1, reachMajorVP:5, srBuildDiscount:0, sysVPMult:1.5, synergyMult:0.5, jrCost:2, srCost:5, srCostPolish:4, discardGold:1,
  srAllowedPreProd:0, qaAllowedPreProd:0,
  resJr:1, resSr:2, resOver:0, resCap:10, crewPartnerCap:1, sysCostMult:1.1, objVPMult:0.9, resSubGold:2, resSubMax:2, srBonus:1,
  handSize:3, objDraw:2, objKeep:1,
  buildsPerRound:1, rdDiscount:3, gatesRandom:1, slotsPerCategory:3,
  teamEventCulture:2,
  culMin:-5, culMax:5, cultureDecay:1, hypeDecay:2, hypeCap:50, prodCap:50, debtMode:1, launchMult:1,
  promoCost0:1, promoCost1:2, promoCost2:3, promoCost3:4, promotionsPerRest:1,
  headhuntMult:2, headhuntComp:0.5, headhuntsPerRest:1,
  lossThreshBase:2,
  crisisEnabled:1,
  draftPool:7, draftPre2:4, draftPre:3, draftProd2:6, draftProd:5, draftPol2:4, draftPol:3, draftLaunch:0,
  scoreShareScale:0.9, scoreShareNormalize:1, debtPenaltyMult:0.75, debtPenaltyCap:15, trackScoring:0, envLabel:"", varC:0, poolScoring:0, poolPot:42, poolPotN:{2:48,3:45,4:42,5:39,6:37}, poolSysMult:2.6, poolObjMult:1.2, poolDebtMult:1, poolGateCap:4, poolGateMult:0.6, poolPassPts:0, poolFavPts:0, raceScoring:1, mergeMktg:0, mktgToHype:1, raceEnd:0, progTarget:40, hypeTarget:30, raceCurve:0.5, racePot:33, debtLossMax:10, cultLossMax:8, raceTriggerVP:6, trackLeaderVP:5, progTrack:{"2":{start:20,step:5,vp:5,max:40},"3":{start:15,step:5,vp:5,max:40},"5":{start:15,step:5,vp:5,max:40}}, mktTrack:{"2":{start:15,step:5,vp:5,max:40},"3":{start:8,step:5,vp:5,max:40},"5":{start:3,step:5,vp:5,max:40}},
  cleanThresh:10, stdThresh:20, roughThresh:30, cleanBonus:5, blockedPenalty:10, roughHypeMult:0.5,
  goldPerVP:3, deliveredBonus:10, synergyOn:1,
  hypeBands:[[0,0],[20,5],[40,10],[60,15],[80,20]],
  deliveryBands:{delivered:10, near:5, far:0, backlash:-10, nearMax:15, farMax:30},
  cultureVP:{"5":8,"4":8,"3":5,"2":5,"1":2,"0":0,"-1":-3,"-2":-3,"-3":-6,"-4":-6,"-5":-10}
};

/* ---------- VARIANT C: phase-shaped economy ----------
   Every spot pays skills (r) OR Hype/Progress, never both. r = skill multiplier for the placing worker (Jr 1 / Sr 2 each, times r).
   Spots with no r and no Progress/Hype are utility spots (Gold, Debt, Culture, specials) and pay no skills. */
D.spotsC = [
 // Skill spots
 {id:"idea1",row:"EARN",discs:["DES","ART"],fx:"",r:1,debt:0,phases:[0,1,2],note:"Earn Ideas (or the skill of the role you fill)"},
 {id:"idea2",row:"EARN",discs:["DES","ART"],fx:"",r:2,debt:0,phases:[0],note:"Earn double skills"},
 {id:"code1",row:"EARN",discs:["ENG","QA"],fx:"",r:1,debt:0,phases:[0,1],note:"Earn Code"},
 {id:"code2",row:"EARN",discs:["ENG","QA"],fx:"",r:2,debt:0,phases:[0],note:"Earn double skills"},
 {id:"plan1",row:"EARN",discs:["DATA","DES"],fx:"",r:1,debt:0,phases:[0],note:"Earn Process"},
 {id:"plan2",row:"EARN",discs:["DATA","ADV"],fx:"",r:2,debt:0,phases:[2],note:"Earn double skills"},
 {id:"buzz1",row:"EARN",discs:["PX","ADV"],fx:"",r:1,debt:0,phases:[1],note:"Earn Buzz"},
 {id:"buzz2",row:"EARN",discs:["PX","ADV"],fx:"",r:2,debt:0,phases:[1,2],note:"Earn double skills"},
 {id:"protosprint",row:"CREW",discs:["ANY"],crew:[["Development","Creative"]],fx:"+1 Culture",r:2,debt:0,phases:[0],note:"Crew: Development + Creative"},
 {id:"labcrew",row:"CREW",discs:["ANY"],crew:[["Creative","Operations"]],fx:"+1 Culture",r:2,debt:0,phases:[1,2],note:"Crew: Creative + Operations"},
 // Progress / Hype spots
 {id:"pitch1",row:"HYPE",discs:["PX","ADV"],fx:"+3 Hype",debt:0,phases:[0],mkt:true},
 {id:"concept2",row:"PROGRESS",discs:["DES","DATA"],fx:"+2 Progress",debt:1,phases:[0]},
 {id:"proto1",row:"PROGRESS",discs:["ENG","ART"],fx:"+1 Progress",debt:1,phases:[0]},
 {id:"kickoff",row:"CREW",discs:["ANY"],crew:[["Creative","Operations"]],fx:"+3 Progress, +1 Culture",debt:0,phases:[0],note:"Crew: Creative + Operations"},
 {id:"build2",row:"PROGRESS",discs:["ENG","DES"],fx:"+2 Progress",debt:1,phases:[1]},
 {id:"buildsprint",row:"CREW",discs:["ANY"],crew:[["Development","Creative"]],fx:"+6 Progress",debt:2,phases:[1],note:"Crew: Development + Creative"},
 {id:"create2",row:"PROGRESS",discs:["ART","DES"],fx:"+1 Progress, +1 Hype",debt:1,phases:[1]},
 {id:"artpush",row:"CREW",discs:["ANY"],crew:[["Creative","Marketing"]],fx:"+3 Progress, +3 Hype",debt:1,phases:[1],mkt:true,note:"Crew: Creative + Marketing"},
 {id:"market3",row:"HYPE",discs:["PX","ADV"],fx:"+3 Hype",debt:0,phases:[1],mkt:true},
 {id:"campaign",row:"CREW",discs:["ANY"],crew:[["Marketing","Operations"]],fx:"+3 Marketing, +3 Hype",debt:0,phases:[1],mkt:true,note:"Crew: Marketing + Operations"},
 {id:"feature",row:"CREW",discs:["ANY"],crew:[["Development","Operations"]],fx:"+5 Progress, -1 Debt",debt:0,phases:[1,2],note:"Crew: Development + Operations"},
 {id:"vslice",row:"CREW",discs:["ANY"],crew:[["Creative","Development","Operations"]],fx:"+8 Progress, +2 Culture",debt:2,phases:[1,2],note:"Crew of 3: Creative + Development + Operations"},
 {id:"playtest1",row:"PROGRESS",discs:["DES"],fx:"+2 Progress",debt:1,phases:[2]},
 {id:"playsession",row:"CREW",discs:["ANY"],crew:[["Creative","Operations"]],fx:"+4 Progress, +2 Marketing",debt:1,phases:[2],note:"Crew: Creative + Operations"},
 {id:"artpass",row:"CREW",discs:["ANY"],crew:[["Creative","Development"]],fx:"+3 Progress, +3 Hype",debt:1,phases:[2],note:"Crew: Creative + Development"},
 {id:"trailer",row:"CREW",discs:["ANY"],crew:[["Creative","Marketing"]],fx:"+5 Hype, +3 Marketing",debt:0,phases:[2],mkt:true,note:"Crew: Creative + Marketing"},
 {id:"pmarket1",row:"HYPE",discs:["PX","ADV"],fx:"+2 Hype, +1 Marketing",debt:0,phases:[2],mkt:true,excl:true},
 {id:"polish",row:"CREW",discs:["ANY"],crew:[["Development","Creative"]],fx:"+5 Progress, -2 Debt",debt:1,phases:[2],note:"Crew: Development + Creative"},
 {id:"opt3",row:"PROGRESS",discs:["QA"],fx:"-2 Debt, +1 Progress",debt:0,phases:[2]},
 {id:"launchprep",row:"CREW",discs:["ANY"],crew:[["Marketing","Operations"]],fx:"+3 Hype, +3 Marketing",debt:0,phases:[2],mkt:true,excl:true,note:"Crew: Marketing + Operations"},
 // Utility spots (Gold, Debt, Culture, specials)
 {id:"test2",row:"PROGRESS",discs:["QA"],fx:"-2 Debt",debt:0,phases:[1,2]},
 {id:"talent1",row:"TALENT",discs:["ANY"],fx:"",special:"talent",debt:0,phases:[0,1,2],mode:"single",tile:"Extra hire from the pool, 1G off",note:"Hire one more worker from the recruitment pool this round (on top of your normal pool hire), and that hire costs 1G less."},
 {id:"outsource",row:"OUTSOURCE",discs:["ANY"],fx:"",special:"outsource",debt:0,phases:[0,1],mode:"single",note:"Jr +3G / Sr +5G"},
 {id:"rd",row:"R&D",discs:["ANY"],crew:[["Creative","Development"],["Operations","Marketing"]],fx:"",special:"rd",debt:0,phases:[0,1,2],mode:"single",tile:"Next build finishes 1 round sooner",note:"R&D crew: Creative + Development, or Operations + Marketing. A system you start building this round finishes one crew round sooner, and you do not pay the Gold rush fee."},
 {id:"team",row:"TEAM EVENT",discs:["ANY"],crew:[["Any","Any"]],fx:"+2 Culture",special:"team",cost:{gold:3},debt:0,phases:[0,1,2,3],mode:"single",note:"Crew: 2 workers of different disciplines (any) + 3G"},
 {id:"insight",row:"INSIGHT",discs:["PX","DATA"],fx:"Draw 1 Milestone",debt:0,phases:[1,2],mode:"shared"},
 {id:"fundraise",row:"FUNDRAISE",discs:["ANY"],fx:"+5G, -1 Culture",debt:0,phases:[2,3],mode:"single",note:"Cash now, Culture later"},
 // Launch
 {id:"ship",row:"PROGRESS",discs:["ENG","QA"],fx:"-4 Debt",debt:0,phases:[3],mode:"single",excl:true},
 {id:"keynote",row:"HYPE",discs:["ADV","PX"],fx:"+6 Hype, +2 Marketing",debt:0,phases:[3],mode:"single",excl:true,mkt:true},
 {id:"press",row:"HYPE",discs:["ADV","PX"],fx:"+2 Hype, +2 Marketing",debt:0,phases:[3],mode:"multi",mkt:true},
 {id:"platform",row:"PROGRESS",discs:["ENG","DES"],fx:"+2 Progress",debt:0,phases:[3],mode:"multi"},
 {id:"party",row:"PARTY",discs:["ANY"],fx:"+2 Hype, +2 Culture",debt:0,phases:[3],mode:"multi"},
 {id:"launchcrew",row:"CREW",discs:["ANY"],crew:[["Development","Creative","Marketing"]],fx:"+12 Progress, +8 Hype",debt:0,phases:[3],mode:"single",mkt:true,note:"Crew of 3: Development + Creative + Marketing"},
 {id:"warroom",row:"CREW",discs:["ANY"],crew:[["Development","Operations"]],fx:"-6 Debt, +6 Progress",debt:0,phases:[3],mode:"single",note:"Crew: Development + Operations"},
 {id:"convert",row:"CONVERT",discs:["ANY"],fx:"",special:"convert",debt:0,phases:[3],mode:"open",tile:"3 skills → 1 Hype or Progress",note:"Each worker converts the skill of their own category: 3 to 1, into Hype or Progress"}
];
// Variant C settings, merged over the defaults when varC is on
D.configC = {
  varC:1, noSwaps:1, resSubMax:0, envLabel:"ENV C · PHASES", rowNames:{EARN:["Backlog","Backlog","Backlog","Backlog"],PROGRESS:["Prototype","Vertical Slice","Beta Build","Gold Master"],HYPE:["Pitch Deck","Trailer Drop","Press Tour","Launch Party"],CREW:["Game Jam","Game Jam","Game Jam","Game Jam"],UTILITY:["Studio Perks","Studio Perks","Studio Perks","Studio Perks"]}, raceCurveByN:{2:0.12,3:0.2,4:0.25,5:0.25,6:0.3}, racePotByN:{2:34,3:33,4:34,5:36,6:36}, debtLossByN:{2:4,3:6,4:8}, cultLossByN:{2:3,3:5,4:6}, phaseEnds:[3,8,11,12],
  spotResOr:1, srSystems:1, srPromoteOnly:1, srAllowedPreProd:1,
  promoFree:1, promoNeedsRest:1, promotionsPerRest:1, headhuntsPerRest:0, overworkCulture:-1,
  recruitCost:3, recruitPerRound:1, recruitSize2:2, recruitSize34:3, recruitSize56:4, recruitInLaunch:0,
  bidEveryRound:1, buildDelay:2, crunchDelay:1, crunchGold:2, rdCrunch:1, rdDiscount:0, convertRate:3,
  income:6, sysGoldMult:0.5, sysCostMult:1, gateProgMult:0.6, gateHypeMult:0.6,
  draftPre:2, draftPre2:3, draftProd:3, draftProd2:4, draftPol:2, draftPol2:3
};
// scale the Progress / Hype / Marketing numbers in the gate requirements (Variant C tuning)
D.cScaleGates = function (data, cfg) {
  const pm = cfg.gateProgMult == null ? 1 : cfg.gateProgMult, hm = cfg.gateHypeMult == null ? 1 : cfg.gateHypeMult;
  const f = r => r.replace(/^(\d+)\+ (Progress|Hype|Marketing value)/, (m, n, w) => Math.max(1, Math.round(+n * (w === "Progress" ? pm : hm))) + "+ " + w);
  // C has few Marketing sources, so Marketing-value gates are read as Hype, and the Culture +1 gate as +0
  const g0 = r => r.replace(/^(\d+)\+ Marketing value$/, "$1+ Hype").replace(/^\+1 Culture$/, "+0 Culture");
  if (data.gatePool) data.gatePool = data.gatePool.filter(g => g.name !== "Pitch Deck");
  [data.publisherGates, data.gatePool].forEach(l => (l || []).forEach(g => { g.reqs = g.reqs.map(g0).map(f); }));
};

D.tutorial = [
  {"id":"welcome","when":"Step 1 · opening card","title":"Welcome to Ship It!","btn":"Let's go","text":"You run a game studio racing a Rival to ship the best game. Over 12 rounds you build a team, put it to work on the board, and build systems that score **Victory Points (VP)**. Most VP wins.\n\nThis version of the game is shaped by **four phases**: **Concept** (rounds 1-3) builds your skill bank, **Production** (4-8) and **Polish** (9-11) balance skills with Progress and Hype, and **Launch** (round 12) is the final push.\n\nThis guided game takes you through the whole game, one phase at a time. When every lesson has been shown the tips disappear and you finish on your own. You can stop the tips at any time with Stop coaching, or leave with the × button."},
  {"id":"loop","when":"Step 2 · structure","title":"How the game is structured","btn":"Next","text":"The bar at the top shows where you are.\n\n**Phase start** happens 4 times in the game: Crisis, Reveal, Bid, Draft. It sets up the draft and the Crisis.\n\n**Round** happens 12 times: a blind Bid for turn order, then Income, Hire, Place, Build, Rest, Milestones, Upkeep. This is where your studio grows.\n\nWe will walk through each one the first time it comes up."},
  {"id":"objectives","when":"Step 3 · pick objectives","title":"Secret objectives","btn":"","text":"First, choose your goals. Objectives are secret cards that pay VP at the end of the game, but only if you completed them.\n\nEach row offers 2 cards. Read what each one needs, pick one per row, then press **Confirm objectives**. Each card shows a skill icon. A finished system whose main skill matches a completed objective earns bonus VP."},
  {"id":"phasestart","when":"Step 4 · reveal and bid","title":"Phase start: Reveal and Bid","btn":"Next","text":"Phase 1 (Concept) has no Crisis card, so we start at **Reveal**: **{draftPool}** discipline cards are dealt face up. They are the people you can hire, and you see them before you bid. The pool is refilled after every pick.\n\nNext is **Bid**: everyone secretly bids gold, and the highest bid picks first in the draft and goes first in that round.\n\n**Every round starts with a bid**, not just the first round of a phase, so turn order is up for grabs each round. (This tutorial only bids once to keep things short.)"},
  {"id":"boardintro","when":"Step 5 · the board","title":"The Board","btn":"Next","text":"The **main board** is where your workers are assigned. Each row has a job. We will go through them one at a time."},
  {"id":"board_backlog","when":"Step 5 · the board · Backlog","title":"Backlog","btn":"Next","text":"**Backlog** earns skills. Each skill belongs to a discipline category: bulb = Ideas (Creative), brackets = Code (Development), gear = Process (Operations), megaphone = Buzz (Marketing).\n\nA Junior earns **+1** of the spot's skill, a Senior **+2**. You spend skills later to build systems."},
  {"id":"board_prototype","when":"Step 5 · the board · Prototype and Quality","title":"Prototype and Quality","btn":"Next","text":"**Prototype** generates **Progress**: how finished your game is.\n\n**Quality** fixes **Tech Debt**: the mess left behind by rushed work."},
  {"id":"board_pitch","when":"Step 5 · the board · Pitch Deck","title":"Pitch Deck","btn":"Next","text":"**Pitch Deck** generates **Hype**: how much the world wants your game."},
  {"id":"board_jam","when":"Step 5 · the board · Game Jam","title":"Game Jam","btn":"Next","text":"**Game Jam** needs a crew of 2 or 3 workers from different categories. It can earn skills or generate Progress.\n\nA worker earning skills is a worker not scoring: that is the central trade-off."},
  {"id":"board_perks","when":"Step 5 · the board · Studio Perks","title":"Studio Perks","btn":"Next","text":"**Studio Perks** are special actions. **Each perk slot takes only one worker per round**, so whoever places first gets it. That is why turn order matters.\n\n**Talent**: recruit one extra worker from the pool, 1G cheaper.\n**Outsource**: a worker earns Gold.\n**Team Event**: send 2 workers with different roles (any two roles that are not the same) and pay 3G to gain +2 Culture.\n**R&D**: send two workers from different disciplines (Creative + Development, or Operations + Marketing). Your next system build finishes 1 round sooner."},
  {"id":"board_rd","when":"Step 5 · the board · R&D","title":"R&D","btn":"Next","text":"**R&D** is a crew spot, not a Studio Perk. Send Creative + Development workers, or Operations + Marketing workers.\n\nAny system you **start building this round finishes one crew round sooner**, and you do not pay the Gold rush fee. Use it on a system you were going to build anyway."},
  {"id":"bid","when":"Step 8 · place a bid","title":"Blind bid for turn order","btn":"","text":"Type an amount and press **Lock in bid**. In a real game every round starts with this bid. **Every player pays their bid, win or lose**, and gold also pays for hiring, so do not overspend. Drafting itself is free.\n\nTry **1**."},
  {"id":"draft","when":"Step 4 · draft","title":"Draft: take a card","btn":"","text":"Now the **Draft**. Players take turns picking one face-up card: press **Draft** on a card to take it, or tap it first to read more. You get **{picks}** picks. Each card is a discipline (ENG, ART, DES and so on) and goes to your hand. **Drafting costs no gold**: you pay only when you hire. Pick a mix of disciplines, because systems need particular roles."},
  {"id":"hire","when":"Step 10 · income and hire","title":"Income, salaries and Hire","btn":"","text":"Round 1 began with **Income**: every studio received **{income}G**. Workers are then paid a **salary** every round (**{salaryJr}G** per Junior, **{salarySr}G** per Senior). You have none yet, so you paid nothing.\n\nYour hand holds the cards you drafted. A card is not a worker until you hire it, and **hiring is where gold is spent**. **Hire Junior** costs **{jrCost}G**. Seniors cannot be hired: they are promoted from Juniors later, in Production.\n\nClick a card, then press **Hire Junior**. Hire at least 2, then press **Done**."},
  {"id":"placeintro","when":"Step 5 · place","title":"Place: put workers to work","btn":"Next","text":"Now you use the board. Players take turns placing **one worker at a time** on a tile that accepts them, going around the table until everyone passes.\n\nMost tiles hold **one worker**, so going early matters: the tile you want can be gone by your turn. That is what turn order is worth.\n\nHover over a greyed tile to see why it cannot be used."},
  {"id":"place1","when":"Step 6 · first worker (nothing selected)","title":"Place your first worker","btn":"","text":"Step 1: **click one of your workers** in your studio panel below."},
  {"id":"place1b","when":"Step 7 · first worker (worker selected)","title":"Place your first worker","btn":"","text":"Step 2: green spots accept this worker. Greyed spots cannot be used (hover to see why). **Click a green spot**, then confirm."},
  {"id":"place1c","when":"Step 8 · first worker (spot popup open)","title":"Place your first worker","btn":"","text":"Read the spot, then press **Place worker here** to confirm. The default choices are fine."},
  {"id":"place1d","when":"Step 9 · first worker (worker popup open)","title":"Place your first worker","btn":"","text":"Press **Select this worker**. The spots they can use will turn green."},
  {"id":"place1w","when":"Step 10 · first worker (Rival's turn)","title":"Place your first worker","btn":"","text":"The Rival is placing. You are next. Read the board while you wait."},
  {"id":"stats","when":"Step 12 · numbers","title":"What your numbers mean","btn":"Next","text":"The spot paid out instantly. What each number is for:\n\n**Gold** hires, recruits, and pays for systems and crunch.\n**Ideas, Code, Process and Buzz** (the four icons) come from earn spots and are spent on systems that need that role. They keep between rounds.\n**Progress** and **Hype** come from score spots and are what the race scoring rewards: the **Race tracks** panel shows where each studio stands, with the gate target marked. Hype fades by {hypeDecay} every round, so build it late.\n**Debt** is Tech Debt: high Debt costs VP. **Culture** is morale: the lowest Culture loses VP."},
  {"id":"place2","when":"Step 11 · keep placing","title":"Keep placing, or pass","btn":"","text":"Each worker can work **once per round**. Place more workers if you want more skills.\n\nYou do not have to place everyone. **A worker you leave unplaced will rest** and recover from tiredness. When you are finished, press **Pass** at the top. Passing ends your placing for this round."},
  {"id":"build","when":"Step 14 · build a system","title":"Build: spend your skills","btn":"","text":"You have **{bank} skills** banked. The **Systems to Build** panel under the board shows what is available. Press **Open Systems to Build** to build: each card shows its cost in skills, plus Gold, and which workers it needs. Only systems you can afford are enabled. You can start **{buildsPerRound}** per round.\n\nA **System** is a permanent engine that scores VP at the end. Building it **commits one worker for every role it needs**: they cannot be placed until it is finished, and it does nothing until then. Stronger systems keep their crew busy longer (1 to 3 rounds).{freeBuild}\n\nBuild one, close the market with **×**, then press **Done**. It appears under **Building** in your studio panel with the round it finishes."},
  {"id":"rest1","when":"Step 15 · tired workers and rest","title":"Rest: tired workers","btn":"","text":"Every worker who worked this round is now **Tired**. A Tired worker who works again becomes **Over-Tired**: no skill, and a chance they quit. A worker who sits out a round **rests and recovers**, so leaving someone unplaced keeps everyone healthy. Workers building a system show **Building** and cannot be placed until it is finished.\n\nThis step is also where you **promote** and **release** workers. Nothing is ready yet: Seniors unlock in Production. Press **Done**."},
  {"id":"miles","when":"Step 12 · milestones","title":"Milestones","btn":"","text":"Milestones are bonus goals in your hand, such as \"have 3 Seniors\". When one is met it shows **MET** and its **Cash in** button turns on. Cash in to take the gold. A greyed button means it is not met yet.\n\nClick a milestone to read it and cash it in. Press **Done** when finished."},
  {"id":"upkeep","when":"Step 17 · upkeep","title":"Upkeep","btn":"Next","text":"**Upkeep** ran automatically: Hype faded, Culture moved toward 0, resting workers recovered, and Over-Tired workers risked quitting. Round 2 then started with a new **{income}G** Income and salaries. The Game Log shows what you paid."},
  {"id":"gates","when":"Step 18 · publisher gates","title":"Publisher Gates","btn":"Next","text":"The **Publisher Gates** panel is your deadline list. At the end of each phase the publisher reviews every studio: **pass** and you get funding, **miss** and you lose VP.\n\n**{gateName}** is due end of round {gateEnd}: {gateReqs}. Pass for +{gateFund}G, miss for −{gatePenalty} VP. The next one, **{gate2Name}**, is stricter. Requirements turn green as you meet them."},
  {"id":"r2hire","when":"Step 19 · round 2","title":"Round 2: you drive","btn":"Let's play round 2","text":"From here you choose for yourself. This round you will **recruit** a worker from the shared pool, **place** your team and leave someone out to rest, and **crunch** a build. The coach checks each one.\n\nFirst, **Hire**: you may hire another card from your hand (Junior {jrCost}G), or keep your gold. Press **Done** when ready."},
  {"id":"r2recruit","when":"Step 20 · recruit (round 2)","title":"Recruit from the shared pool","btn":"","text":"The **Recruitment** panel above the board is a **shared pool** with one worker from each of **{recruitN}** categories. It re-rolls every round. **Recruit** one for **{recruitCost}G**: you get a Junior at once, with no card needed, and you can place them this round. One recruit per round, and a rival can take the one you want.\n\nPress **Recruit** under a worker you like, then keep placing."},
  {"id":"r2place","when":"Step 21 · place (round 2)","title":"Place your team","btn":"","text":"Place your workers. **A worker you leave unplaced rests**, and in Production a Junior who has worked and then rested can be promoted, so leave at least one out.\n\nPress **Pass** when you are finished."},
  {"id":"r2crunch","when":"Step 22 · crunch (round 2)","title":"Crunch: finish a build sooner","btn":"","text":"A system keeps its crew busy for 1 to 3 rounds. **Crunch** takes one round off, so the crew is freed sooner. It costs **{crunchGold}G**, or makes one worker more tired. In the market, set **Build speed** to Crunch before you build.{freeBuild}\n\nBuild a system with Crunch, close the market with **×**, then press **Done**."},
  {"id":"r3","when":"Step 23 · rounds 2 and 3","title":"Rounds 2 and 3: keep building","btn":"","text":"Concept ends after round 3, and **Production** rewards Progress and Hype, so spend your bank on systems now.\n\n{hint}"},
  {"id":"gateresult","when":"Step 24 · gate result","title":"Concept gate result","btn":"Next","text":"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}"},
  {"id":"gate_pass","when":"Step 13 · gate result (passed)","title":"","btn":"","text":"You **passed** and received **{gateFund}G**."},
  {"id":"gate_miss","when":"Step 14 · gate result (missed)","title":"","btn":"","text":"You **missed** it and lost **{gatePenalty} VP**."},
  {"id":"crisis","when":"Step 25 · crisis (round 4)","title":"Production begins: a Crisis","btn":"Got it","text":"Round 4 starts a new phase, and every phase after the first opens with a **Crisis card**, an event that hits every studio{crisisLine}.\n\nProduction brings more score spots, Buzz earn spots, bigger crews and **Seniors**."},
  {"id":"r4play","when":"Step 26 · bid, draft, hire, place (round 4)","title":"Round 4: play your round","btn":"","text":"Bid and draft work as before: every bid is paid, so pick the disciplines you need. Then hire Juniors, place, and leave someone out to rest so you can promote them.\n\n{hint}"},
  {"id":"promote","when":"Step 27 · promote","title":"Promote a Junior to Senior","btn":"","text":"A Junior who has **worked** and is now **resting** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**.\n\nClick one of your workers in the Rest panel and press **Promote**. Choose one whose role matches a system you built, so it can trigger it next round."},
  {"id":"trigger","when":"Step 28 · trigger a system","title":"A Senior triggers a system","btn":"","text":"By round 5 your system should be finished and your Senior ready. A finished system leaves the Building list and joins your studio. When it is your turn to place, select your Senior, click the **system tile** in your studio panel, and confirm: the system pays its bonus instead of the Senior using a board spot. Each system triggers once per round.\n\nHire or recruit first if you like."},
  {"id":"prod","when":"Step 29 · production","title":"Production: balance your studio","btn":"","text":"Play freely through Production (rounds 4 to 8): spend skills on systems, take score spots for Progress and Hype, and keep Debt and Culture healthy.\n\n{hint}"},
  {"id":"polish","when":"Step 30 · polish","title":"Polish begins","btn":"Got it","text":"**Polish** runs rounds 9 to 11. Check the gate panel: the Beta Review is due at the end of round 11. Stronger systems commit their crew for longer (one round less with Crunch), and **builds stop in the last rounds** because they could not finish in time."},
  {"id":"polishfree","when":"Step 15 · polish, free play","title":"Polish","btn":"","text":"{hint}"},
  {"id":"convert","when":"Step 32 · launch and convert","title":"Launch: convert your leftovers","btn":"","text":"**Round 12 is Launch.** Nothing carries over, so spend your skills and Gold now. Place a worker on the **Convert** spot: it turns **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**. Leftover skills are otherwise worth nothing.\n\nSelect a worker, click Convert, choose Progress or Hype, and confirm. You can place other workers too."},
  {"id":"handover","when":"Step 33 · hand-over","title":"That is every lesson","btn":"Finish the game","text":"You have seen every part of the game: the round steps, the phases, recruiting, promoting, systems, crunch and Convert. The tips stop here.\n\nFinish round 12 on your own. The results screen explains where every VP came from."},
  {"id":"hint_hire","when":"Hint · hire step","title":"","btn":"","text":"**Hire.** Recruit from your hand (Junior {jrCost}G). Cards you skip stay in your hand. The Talent spots on the board make hiring cheaper. Press **Done** when finished."},
  {"id":"hint_place","when":"Hint · place step","title":"","btn":"","text":"**Place.** Select a worker, then a green spot. Leave a Tired worker unplaced so they rest and recover. Recruit from the shared pool if you like. **Pass** when finished."},
  {"id":"hint_build","when":"Hint · build step","title":"","btn":"","text":"**Build.** Spend your skills on a system, then press **Done**. The **Systems to Build** panel under the board shows 2 per type; greyed ones cannot be built yet. Replace costs {refreshGold}G."},
  {"id":"hint_rest","when":"Hint · rest step","title":"","btn":"","text":"**Rest.** Promote a Junior who worked and rested, or release a worker. Press **Done**."},
  {"id":"hint_miles","when":"Hint · milestones step","title":"","btn":"","text":"**Milestones.** Cash in anything that is met, then press **Done**."},
  {"id":"hint_wait","when":"Hint · other steps","title":"","btn":"","text":"Resolving…"},
  {"id":"free_bid","when":"Hint · free-play bid","title":"","btn":"","text":"Same blind bid as before. Remember that every bid is paid."},
  {"id":"free_draft","when":"Hint · free-play draft","title":"","btn":"","text":"Draft again. Pick the disciplines your studio needs."},
  {"id":"msg_next","when":"Blocked-action message","title":"","btn":"","text":"Press Next first"},
  {"id":"msg_start","when":"Blocked-action message","title":"","btn":"","text":"Press “Let's go” to begin"},
  {"id":"msg_obj","when":"Blocked-action message","title":"","btn":"","text":"Choose your objectives first"},
  {"id":"msg_bid","when":"Blocked-action message","title":"","btn":"","text":"Place your bid first"},
  {"id":"msg_bid_small","when":"Blocked-action message","title":"","btn":"","text":"Keep it small for now: bid 0 to 3G"},
  {"id":"msg_draft","when":"Blocked-action message","title":"","btn":"","text":"Pick a card from the draft"},
  {"id":"msg_hire_sr","when":"Blocked-action message","title":"","btn":"","text":"Seniors are promoted, not hired"},
  {"id":"msg_hire_min","when":"Blocked-action message","title":"","btn":"","text":"Hire at least 2 workers so you have something to place"},
  {"id":"msg_hire_do","when":"Blocked-action message","title":"","btn":"","text":"Hire from your hand, then press Done"},
  {"id":"msg_place","when":"Blocked-action message","title":"","btn":"","text":"Place a worker on a green spot"},
  {"id":"msg_place_first","when":"Blocked-action message","title":"","btn":"","text":"Place at least one worker first"},
  {"id":"msg_place_pass","when":"Blocked-action message","title":"","btn":"","text":"Keep placing, or press Pass"},
  {"id":"msg_build_first","when":"Blocked-action message","title":"","btn":"","text":"Try building one system first"},
  {"id":"msg_build","when":"Blocked-action message","title":"","btn":"","text":"Build a system, then press Done"},
  {"id":"msg_rest","when":"Blocked-action message","title":"","btn":"","text":"Press Done to continue"},
  {"id":"msg_miles","when":"Blocked-action message","title":"","btn":"","text":"Cash in a met milestone, or press Done"},
  {"id":"msg_recruit","when":"Blocked-action message","title":"","btn":"","text":"Recruit one worker from the shared pool first"},
  {"id":"msg_crunch","when":"Blocked-action message","title":"","btn":"","text":"Start this build with Crunch"},
  {"id":"msg_promote","when":"Blocked-action message","title":"","btn":"","text":"Promote a Junior who has worked and rested"},
  {"id":"msg_promote_fit","when":"Blocked-action message","title":"","btn":"","text":"Promote a worker whose role matches one of your systems"},
  {"id":"msg_trigger","when":"Blocked-action message","title":"","btn":"","text":"Place your Senior on the system tile"},
  {"id":"msg_convert","when":"Blocked-action message","title":"","btn":"","text":"Place a worker on the Convert spot"},
  {"id":"msg_headhunt","when":"Blocked-action message","title":"","btn":"","text":"Headhunting is an advanced rule for later"},
  {"id":"ui_back","when":"Coach label","title":"","btn":"","text":"← Back"},
  {"id":"ui_fwd","when":"Coach label","title":"","btn":"","text":"Next"},
  {"id":"ui_fwd_end","when":"Coach label","title":"","btn":"","text":"Back to the game"},
  {"id":"ui_next","when":"Coach label","title":"","btn":"","text":"Next"},
  {"id":"ui_stop","when":"Coach label","title":"","btn":"","text":"Stop coaching"},
  {"id":"ui_wait","when":"Coach label","title":"","btn":"","text":"Rival is taking their turn…"},
  {"id":"ui_step","when":"Coach label","title":"","btn":"","text":"Step {n} of {total}"},
  {"id":"ui_review","when":"Coach label","title":"","btn":"","text":"review"},
  {"id":"explain_note","when":"Results explainer · closing note","title":"","btn":"","text":"This is how your score was made, row by row. Start a real game to play for a higher one."},
  {"id":"explain_prodShare","when":"Results explainer · row","title":"Progress race","btn":"","text":"VP for where your Progress ranks against the other studios: 1st place pays most, ties split the points."},
  {"id":"explain_hypeStrength","when":"Results explainer · row","title":"Hype race","btn":"","text":"Where your Hype ranks. At the end of the game your Marketing is added to your Hype, so Marketing is permanent buzz while Hype itself fades every round."},
  {"id":"explain_debtPenalty","when":"Results explainer · row","title":"Tech Debt","btn":"","text":"The studio with the most Debt loses the most VP; the studio with the least loses none. Debt comes from rushed spots and some systems; Engineers and Stability systems clear it."},
  {"id":"explain_culture","when":"Results explainer · row","title":"Culture","btn":"","text":"The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay."},
  {"id":"explain_objectives","when":"Results explainer · row","title":"Objectives","btn":"","text":"Your secret goals. VP only for the ones you completed."},
  {"id":"explain_synergy","when":"Results explainer · row","title":"Synergy","btn":"","text":"Bonus when a built system's main skill matches the skill icon of a completed objective."},
  {"id":"explain_systems","when":"Results explainer · row","title":"Systems","btn":"","text":"The printed VP on each system you built."},
  {"id":"explain_gold","when":"Results explainer · row","title":"Gold","btn":"","text":"Leftover gold converts to VP at a fixed rate."},
  {"id":"explain_crisis","when":"Results explainer · row","title":"Crisis & Gates","btn":"","text":"VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP)."}
];

D.gate = { fnv: "349b4c0b", passphraseHash: "da0dfb5975f38caa0e062ba214404524ee4f093d588b56b9b85952791eff0921", note:"Client-side deterrent only. Replace with Cloudflare Access / a Worker check when migrating." };

/* ---------- TEXT REGISTRY: player-facing wording the Data Studio can edit (display only) ---------- */
(function () {
  const rows = [], add = (id, group, label, text) => rows.push({ id, group, label, text });
  Object.keys(D.disciplines).forEach(k => { const x = D.disciplines[k]; [["name", "name"], ["short", "one-line summary"], ["util", "rest action"]].forEach(f => { if (typeof x[f[0]] === "string") add("disc." + k + "." + f[0], "Disciplines", x.name + " · " + f[1], x[f[0]]); }); });
  Object.keys(D.labels).forEach(k => add("label." + k, "Terms", "Term: " + k, D.labels[k]));
  Object.keys(D.typeRules).forEach(k => add("typeRule." + k, "Category rules", k + " systems", D.typeRules[k]));
  Object.keys(D.symbols).forEach(k => add("symbol." + k, "Symbols", k + " meaning", D.symbols[k].meaning));
  D.phases.forEach((p, i) => add("phase." + i + ".name", "Phases", "Phase " + (i + 1) + " name", p.name));
  const base = JSON.parse(JSON.stringify(rows));
  D.textRows = () => JSON.parse(JSON.stringify(base));
  D.applyText = list => { const m = {}; (list || []).forEach(r => { if (r && r.id) m[r.id] = r.text; });
    base.forEach(b => { const v = m[b.id] != null ? m[b.id] : b.text, p = b.id.split("."); if (p[0] === "disc") D.disciplines[p[1]][p[2]] = v; else if (p[0] === "label") D.labels[p[1]] = v; else if (p[0] === "typeRule") D.typeRules[p[1]] = v; else if (p[0] === "symbol") D.symbols[p[1]].meaning = v; else if (p[0] === "phase") D.phases[+p[1]].name = v; }); };
})();

root.SHIPIT_DATA = D;
if (typeof module !== "undefined") module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
