import EventEmitter from 'events';

type TraverseCallback = (mod: Module) => void;

export default class Module extends EventEmitter {
  private readonly modules: Module[];
  
  constructor() {
    super();
    
    this.modules = [];
  }
  
  public traverse(fn: TraverseCallback): void {
    fn(this);
    
    for (const mod of this.modules)
      mod.traverse(fn);
  }
  
  public use<M extends Module>(mod: M): M {
    this.modules.push(mod);
    
    return mod;
  }
  
  protected async callInit(): Promise<void> {
    for (const mod of this.modules) {
      await mod.callInit();
      
      mod.on('error', err => this.emit('error', err));
    }
    
    await this.init();
    
    this.emit('init');
  }
  
  protected async init(): Promise<void> {
    // Empty
  }
  
  protected async callDestroy(): Promise<void> {
    this.emit('destroy');
    
    await this.destroy();
    
    const reversed = this.modules.slice().reverse();
    for (const mod of reversed)
      await mod.callDestroy();
  }
  
  protected async destroy(): Promise<void> {
    // Empty
  }
}
