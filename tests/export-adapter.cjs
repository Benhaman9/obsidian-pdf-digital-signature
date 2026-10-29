const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transformSync}=require('esbuild');
function fixture() {
  const notices=[],cleanups=[];
  class Modal { open(){return 'native-open';} }
  const modules=new Map();
  function load(name) {
    if(modules.has(name))return modules.get(name).exports;
    const module={exports:{}};modules.set(name,module);
    const code=transformSync(fs.readFileSync(path.join(__dirname,'../src',name+'.ts'),'utf8'),{loader:'ts',format:'cjs',target:'es2020'}).code;
    vm.runInNewContext(code,{module,exports:module.exports,Buffer,console,require(id){
      if(id==='obsidian')return {Modal,PluginSettingTab:class{},Setting:class{},Notice:class{constructor(message){notices.push(message);}},getLanguage:()=> 'en'};
      return id.startsWith('./')?load(id.slice(2)):require(id);
    }});return module.exports;
  }
  const plugin={settings:{firmarCriptograficamente:false},register(fn){cleanups.push(fn);}};
  const adapter=new (load('obsidian-export-adapter').ObsidianExportAdapter)(plugin);
  return {Modal,adapter,notices,cleanups};
}
test('adapter ignores unrelated modals and restores its hook without deleting later hooks',()=>{
  const {Modal,adapter,cleanups}=fixture();const original=Modal.prototype.open;adapter.install();
  assert.equal(new Modal().open(),'native-open');assert.equal(adapter.compatibility,'unchecked');
  const own=Modal.prototype.open;function later(){return own.call(this);}Modal.prototype.open=later;
  cleanups[0]();assert.equal(Modal.prototype.open,later);assert.equal(new Modal().open(),'native-open');
  Modal.prototype.open=original;
});
test('an incompatible export modal disables automatic integration once and leaves manual/native methods intact',()=>{
  const {adapter,notices}=fixture();const print=async()=> 'native';
  const modal={file:{},printToPdf:print,modalEl:{classList:{contains:()=>true}},contentEl:{}};
  adapter.enhance(modal);adapter.enhance(modal);
  assert.equal(adapter.compatibility,'unavailable');assert.equal(notices.length,1);
  assert.equal(modal.printToPdf,print);assert.equal(modal._firmaPdfEnhanced,undefined);
  assert.match(notices[0],/manual/i);
});
test('a partial enhancement failure rolls back the marker and native methods',()=>{
  const {adapter,notices}=fixture();const print=async()=> 'native';
  const modal={file:{},printToPdf:print,modalEl:{classList:{contains:()=>true}},contentEl:{createDiv(){throw new Error('changed UI');}}};
  adapter.enhance(modal);assert.equal(adapter.compatibility,'unavailable');
  assert.equal(modal.printToPdf,print);assert.equal(modal._firmaPdfEnhanced,false);assert.equal(notices.length,1);
});
test('a non-writable native hook falls back without throwing during startup',()=>{
  const {Modal,adapter,notices}=fixture();Object.defineProperty(Modal.prototype,'open',{value:Modal.prototype.open,writable:false,configurable:true});
  assert.doesNotThrow(()=>adapter.install());assert.equal(adapter.compatibility,'unavailable');assert.equal(notices.length,1);
});
