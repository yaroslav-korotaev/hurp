export interface Module {
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export default class Hurp {
  private readonly modules: Module[];
  
  constructor() {
    this.modules = [];
  }
  
  public use<M extends Module>(mod: M): M {
    this.modules.push(mod);
    
    return mod;
  }
  
  public async init(): Promise<void> {
    for (const mod of this.modules)
      await mod.init();
  }
  
  public async destroy(): Promise<void> {
    const reversed = this.modules.slice().reverse();
    for (const mod of reversed)
      await mod.destroy();
  }
}
