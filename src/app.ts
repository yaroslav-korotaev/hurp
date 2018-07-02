import Module from './module';

export default class App extends Module {
  constructor() {
    super();
  }
  
  public async boot(): Promise<void> {
    await this.callInit();
    
    this.emit('online');
  }
  
  public async shutdown(): Promise<void> {
    await this.callDestroy();
    
    this.emit('offline');
  }
}
