const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {transformSync} = require('esbuild');

test('native export refreshes adaptive MathJax CSS after rendering fractions and aligned rows', {
  skip: !process.env.PDF_TEST_OBSIDIAN_ASAR || !process.env.PDF_TEST_OUTPUT,
}, async () => {
  const {chromium} = require(process.env.PDF_TEST_PLAYWRIGHT || 'playwright');
  const out = path.join(process.env.PDF_TEST_OUTPUT, 'math');
  fs.mkdirSync(out, {recursive:true});
  const archive = fs.readFileSync(process.env.PDF_TEST_OBSIDIAN_ASAR);
  const header = JSON.parse(archive.subarray(16,16+archive.readUInt32LE(12)));
  const offset = 8+archive.readUInt32LE(4);
  function extract(items, folder) {
    for (const [name,item] of Object.entries(items)) {
      if (name === '.DS_Store') continue;
      const dest = path.join(folder,name);
      if (item.files) extract(item.files,dest);
      else {
        fs.mkdirSync(path.dirname(dest),{recursive:true});
        fs.writeFileSync(dest,archive.subarray(offset+Number(item.offset),offset+Number(item.offset)+item.size));
      }
    }
  }
  extract(header.files.lib.files.mathjax.files,path.join(out,'mathjax'));
  const html = `<!doctype html><meta charset="utf-8"><script>
    window.MathJax={loader:{paths:{'mathjax-tex':'./mathjax/tex-font'}},output:{font:'mathjax-tex'},startup:{typeset:false},options:{enableMenu:false,enableExplorer:false,enableEnrichment:false}};
    </script><script src="./mathjax/obsidian-mathjax.js"></script>`;
  fs.writeFileSync(path.join(out,'test.html'),html);
  const code = transformSync(fs.readFileSync(path.join(__dirname,'../src/math-print-styles.ts'),'utf8'),{loader:'ts',format:'iife',globalName:'MathPrint'}).code;
  const browser = await chromium.launch({executablePath:process.env.PDF_TEST_CHROMIUM,headless:true});
  try {
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.join(out,'test.html')).href);
    await page.addScriptTag({content:code});
    const result=await page.evaluate(async()=>{
      await MathJax.startup.promise;
      document.body.append(MathJax.tex2chtml('x',{display:true}));
      const style=MathJax.chtmlStylesheet(); document.head.append(style);
      const initial=Array.from(style.sheet.cssRules,r=>r.cssText).join('\n');
      const frame=document.createElement('iframe'); document.body.append(frame);
      const dest=frame.contentDocument;
      const old=dest.createElement('style'); old.id=style.id; old.textContent=initial; dest.head.append(old);
      const expr=MathJax.tex2chtml(String.raw`\begin{aligned}a&=\frac{3}{4}\\b&=\sqrt{x^2+y^2}\end{aligned}`,{display:true});
      document.body.append(expr); MathJax.chtmlStylesheet();
      dest.body.append(expr.cloneNode(true));
      const frac=dest.querySelector('mjx-frac');
      const measure=()=>({display:dest.defaultView.getComputedStyle(frac).display,height:frac.getBoundingClientRect().height});
      const before=measure();
      await MathPrint.refreshMathPrintStyles(document,dest.body);
      const after=measure();
      const sameClone=dest.getElementById(style.id)===old;
      old.remove();
      await MathPrint.refreshMathPrintStyles(document,dest.body);
      const missingCloneRecovered=Boolean(dest.getElementById(style.id));
      const blank=dest.createElement('div');
      await MathPrint.refreshMathPrintStyles(document,blank);
      await MathPrint.refreshMathPrintStyles(document,document.body);
      return {version:MathJax.version,initialRules:initial.length,freshRules:style.sheet.cssRules.length,before,after,sameClone,missingCloneRecovered};
    });
    assert.equal(result.before.display,'inline','Reproduces stale native stylesheet');
    assert.equal(result.after.display,'inline-block');
    assert.ok(result.after.height>result.before.height*1.5,'Fraction must regain vertical layout');
    assert.ok(result.sameClone);
    assert.ok(result.missingCloneRecovered);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
    await page.screenshot({path:path.join(out,'fixed.png'),fullPage:true});
  } finally {await browser.close();}
});
