const Module = require('./module.js');

class App extends Module {
  constructor() {
    super();
    
    this.app = this;
  }
  
  async boot() {
    await this.callInit();
    
    this.emit('online');
  }
  
  async shutdown() {
    await this.callDestroy();
    
    this.emit('offline');
  }
}

module.exports = App;
