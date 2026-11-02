const { chromium } = require('playwright');
(async()=>{const br=await chromium.launch();const pg=await br.newPage();
await pg.goto('file:///home/claude/work/ref/ship-it-reference-pack.html');
await pg.pdf({path:'/home/claude/work/ref/ship-it-reference-pack.pdf',format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});
await br.close();})();
