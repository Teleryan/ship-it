// Writes dist/shipit-site.json into KV keys site:a / site:b / site:c via the Cloudflare API
const fs=require("fs");
const {CLOUDFLARE_API_TOKEN:T,CLOUDFLARE_ACCOUNT_ID:A,KV_NAMESPACE_ID:N}=process.env;
const site=JSON.parse(fs.readFileSync(__dirname+"/../dist/shipit-site.json","utf8"));
(async()=>{
  for(const k of Object.keys(site)){
    const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${A}/storage/kv/namespaces/${N}/values/site:${k}`,
      {method:"PUT",headers:{Authorization:"Bearer "+T,"content-type":"text/plain"},body:JSON.stringify(site[k])});
    const j=await r.json(); if(!j.success){console.error(k,j);process.exit(1)} console.log("KV site:"+k,"ok");
  }
})();
