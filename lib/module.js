const EventEmitter = require('events');

class Module extends EventEmitter {
  constructor() {
    super();
    
    this.app = null;
    this.modules = [];
  }
  
  traverse(fn) {
    fn(this);
    
    for (const mod of this.modules)
      mod.traverse(fn);
  }
  
  use(mod) {
    mod.traverse(child => {
      child.app = this.app;
    });
    this.modules.push(mod);
    
    return mod;
  }
  
  async callInit() {
    for (const mod of this.modules) {
      await mod.callInit();
      
      mod.on('error', err => this.emit('error', err));
    }
    
    await this.init();
    
    this.emit('init');
  }
  
  async init() {
    // Empty
  }
  
  async callDestroy() {
    this.emit('destroy');
    
    await this.destroy();
    
    const reversed = this.modules.slice().reverse();
    for (const mod of reversed)
      await mod.callDestroy();
  }
  
  async destroy() {
    // Empty
  }
}

module.exports = Module;
