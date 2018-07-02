import { expect } from 'chai';
import sinon from 'sinon';
import { Module } from '../src';
import { HackedModule } from './types';

async function delay(ms: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms));
}

function createModule(): HackedModule {
  return new Module() as any;
}

describe('module.js', function () {
  it('composing modules', function () {
    const a = createModule();
    const b = createModule();
    const c = createModule();
    
    a.use(b);
    a.use(c);
    
    expect(a.modules).to.have.ordered.members([b, c]);
  });
  
  it('traverses all the tree', function () {
    const a = createModule();
    const b = createModule();
    const c = createModule();
    const d = createModule();
    
    a.use(b);
    b.use(c);
    a.use(d);
    
    const fn = sinon.spy();
    a.traverse(fn);
    
    expect(fn.callCount).to.be.equal(4);
    expect(fn.firstCall.calledWith(a)).to.be.true;
    expect(fn.getCall(1).calledWith(b)).to.be.true;
    expect(fn.getCall(2).calledWith(c)).to.be.true;
    expect(fn.getCall(3).calledWith(d)).to.be.true;
  });
  
  it('can init() and destroy() if methods are not overriden', async function () {
    const a = createModule();
    
    await a.callInit();
    await a.callDestroy();
  });
  
  it('catching submodule errors', async function () {
    const a = createModule();
    const b = createModule();
    const c = createModule();
    
    a.use(b);
    b.use(c);
    
    const listener = sinon.spy();
    a.on('error', listener);
    await a.callInit();
    
    const err = new Error('test');
    c.emit('error', err);
    
    expect(listener.calledOnce).to.be.true;
    expect(listener.calledWith(err)).to.be.true;
  });
  
  it('waits for init() and then emits \'init\'', async function () {
    const a = createModule();
    
    const listener = sinon.spy();
    const check = sinon.spy();
    sinon.stub(a, 'init').callsFake(async () => {
      await delay(10);
      check();
    });
    
    a.on('init', listener);
    await a.callInit();
    
    expect(a.init.calledOnce).to.be.true;
    expect(check.calledOnce).to.be.true;
    expect(listener.calledOnce).to.be.true;
    expect(a.init.calledBefore(listener)).to.be.true;
    expect(check.calledBefore(listener)).to.be.true;
  });
  
  it('emits \'destroy\' and then waits for destroy()', async function () {
    const a = createModule();
    
    const listener = sinon.spy();
    const check = sinon.spy();
    sinon.stub(a, 'destroy').callsFake(async () => {
      await delay(10);
      check();
    });
    
    a.on('destroy', listener);
    await a.callDestroy();
    
    expect(listener.calledOnce).to.be.true;
    expect(a.destroy.calledOnce).to.be.true;
    expect(check.calledOnce).to.be.true;
    expect(listener.calledBefore(a.destroy)).to.be.true;
    expect(listener.calledBefore(check)).to.be.true;
  });
  
  it('init all the tree in right order', async function () {
    const a = createModule();
    const b = createModule();
    const c = createModule();
    const d = createModule();
    const e = createModule();
    
    sinon.stub(a, 'init').resolves();
    sinon.stub(b, 'init').resolves();
    sinon.stub(c, 'init').resolves();
    sinon.stub(d, 'init').resolves();
    sinon.stub(e, 'init').resolves();
    
    b.use(c);
    a.use(b);
    a.use(d);
    d.use(e);
    
    await a.callInit();
    
    expect(a.init.calledOnce).to.be.true;
    expect(b.init.calledOnce).to.be.true;
    expect(c.init.calledOnce).to.be.true;
    expect(d.init.calledOnce).to.be.true;
    expect(e.init.calledOnce).to.be.true;
    
    expect(c.init.calledBefore(b.init)).to.be.true;
    expect(b.init.calledBefore(a.init)).to.be.true;
    expect(e.init.calledBefore(d.init)).to.be.true;
    expect(d.init.calledBefore(a.init)).to.be.true;
  });
  
  it('destroy all the tree in reverse order', async function () {
    const a = createModule();
    const b = createModule();
    const c = createModule();
    const d = createModule();
    const e = createModule();
    
    sinon.stub(a, 'destroy').resolves();
    sinon.stub(b, 'destroy').resolves();
    sinon.stub(c, 'destroy').resolves();
    sinon.stub(d, 'destroy').resolves();
    sinon.stub(e, 'destroy').resolves();
    
    b.use(c);
    a.use(b);
    a.use(d);
    d.use(e);
    
    await a.callDestroy();
    
    expect(a.destroy.calledOnce).to.be.true;
    expect(b.destroy.calledOnce).to.be.true;
    expect(c.destroy.calledOnce).to.be.true;
    expect(d.destroy.calledOnce).to.be.true;
    expect(e.destroy.calledOnce).to.be.true;
    
    expect(a.destroy.calledBefore(b.destroy)).to.be.true;
    expect(b.destroy.calledBefore(c.destroy)).to.be.true;
    expect(a.destroy.calledBefore(d.destroy)).to.be.true;
    expect(d.destroy.calledBefore(e.destroy)).to.be.true;
  });
});
