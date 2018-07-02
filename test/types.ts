import { EventEmitter } from 'events';
import { SinonStub } from 'sinon';

export interface HackedModule extends EventEmitter {
  modules: HackedModule[];
  traverse(fn: (mod: HackedModule) => void): void;
  use<M extends HackedModule>(mod: M): M;
  callInit(): Promise<void>;
  init: SinonStub; // tslint:disable-line:member-ordering
  callDestroy(): Promise<void>;
  destroy: SinonStub; // tslint:disable-line:member-ordering
}

export interface HackedApp extends HackedModule {
  boot(): Promise<void>;
  shutdown(): Promise<void>;
}
