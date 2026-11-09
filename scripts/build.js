// Builds the game (Variant D, the only variant) into dist/shipit-site.json (minified). Key "d" = file map, as the worker expects.
const fs=require("fs"),path=require("path"),cp=require("child_process");
const G=path.join(__dirname,"..","game"), OUT=path.join(__dirname,"..","dist");
const FILES=["index.html","styles.css","data.js","core.js","engine.js","bot.js","studio.js","studio2.js","studio.css","tutorial.js","net.js","analytics.js","admin.js","stats.js","simui.js","rules.js","ui.js"];
const T=path.join(__dirname,"..","node_modules",".bin","terser");
fs.mkdirSync(OUT,{recursive:true});
const files={};
for(const f of FILES){
  let t=fs.readFileSync(path.join(G,f),"utf8");
  if(f==="index.html") t=t.replace("<title>SHIP IT!: Hot-seat Prototype</title>","<title>SHIP IT!</title>");
  if(f.endsWith(".js")){
    const tmp=path.join(OUT,"_t.js"); fs.writeFileSync(tmp,t);
    t=cp.execFileSync(T,[tmp,"-c","-m"],{maxBuffer:1<<28}).toString();
  }
  files[f]=t;
}
fs.unlinkSync(path.join(OUT,"_t.js"));
fs.writeFileSync(path.join(OUT,"shipit-site.json"),JSON.stringify({d:files}));
console.log("built",Object.keys(files).length,"files",fs.statSync(path.join(OUT,"shipit-site.json")).size);
