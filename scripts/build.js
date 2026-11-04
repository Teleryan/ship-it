// Builds the four environments (D Burnout at /, C Phases at /c/, A classic at /a/, B pools at /b/) into dist/shipit-site.json (minified)
const fs=require("fs"),path=require("path"),cp=require("child_process");
const G=path.join(__dirname,"..","game"), OUT=path.join(__dirname,"..","dist");
const FILES=["index.html","styles.css","data.js","core.js","engine.js","bot.js","studio.js","studio2.js","tutorial.js","net.js","analytics.js","admin.js","stats.js","simui.js","rules.js","ui.js"];
const T=path.join(__dirname,"..","node_modules",".bin","terser");
function env(sub){
  const o={};
  for(const f of FILES){
    let t=fs.readFileSync(path.join(G,f),"utf8");
    if(f==="data.js"){ for(const [a,b] of sub.data||[]) t=t.replace(a,b); }
    if(f==="index.html"){ for(const [a,b] of sub.html||[]) t=t.replace(a,b); }
    if(f.endsWith(".js")){
      const tmp=path.join(OUT,"_t.js"); fs.writeFileSync(tmp,t);
      t=cp.execFileSync(T,[tmp,"-c","-m"],{maxBuffer:1<<28}).toString();
    }
    o[f]=t;
  }
  return o;
}
fs.mkdirSync(OUT,{recursive:true});
const TITLE="<title>SHIP IT!: Hot-seat Prototype</title>";
const out={
  a:env({}),
  b:env({data:[["poolScoring:0,","poolScoring:1,"],['envLabel:"",','envLabel:"ENV B · POOLS",'],[/poolDebtMult:[0-9.]*,/,"poolDebtMult:4,"]],html:[[TITLE,"<title>SHIP IT! (Env B: Pools)</title>"]]}),
  d:env({data:[[" varC:0,"," varC:1,"],[" burnout:0,"," burnout:1,"],[" train:0,"," train:1,"],[" smallDrop:[],"," smallDrop:[\"insight\"],"],[" hypeBank:0,"," hypeBank:3,"],[" recruitDelta:0,"," recruitDelta:-1,"],[" hireDiscard:1,"," hireDiscard:0,"],['{"cat": "Economy", "gold": 4, "name": "Liquidation", "text": "Discard 2+ cards for Gold in one round", "phases": [1, 2]}','{"cat": "Workforce", "gold": 4, "name": "Double Recruit", "text": "Recruit 2 workers from the shared pool in one round", "phases": [1, 2]}'],[/envLabel:"ENV C · PHASES"/g,'envLabel:"ENV D · BURNOUT"'],['envLabel:"",','envLabel:"ENV D · BURNOUT"' + ","]],html:[[TITLE,"<title>SHIP IT! (Env D: Burnout)</title>"]]}),
  c:env({data:[[" varC:0,"," varC:1,"],['envLabel:"",','envLabel:"ENV C · PHASES"' + ","]],html:[[TITLE,"<title>SHIP IT! (Env C: Phases)</title>"]]}),
};
fs.unlinkSync(path.join(OUT,"_t.js"));
fs.writeFileSync(path.join(OUT,"shipit-site.json"),JSON.stringify(out));
console.log("built",Object.keys(out).map(k=>k+":"+Object.keys(out[k]).length).join(" "),fs.statSync(path.join(OUT,"shipit-site.json")).size);
