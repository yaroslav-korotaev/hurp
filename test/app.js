const sinon = require('sinon');
const { App } = require('../lib');

describe('app.js', function () {
  it('boot() and emits \'online\'', async function () {
    const app = new App();
    
    const listener = sinon.spy();
    sinon.stub(app, 'init').resolves();
    
    app.on('online', listener);
    await app.boot();
    
    expect(app.init.calledOnce).to.be.true;
    expect(listener.calledOnce).to.be.true;
    expect(app.init.calledBefore(listener)).to.be.true;
  });
  
  it('shutdown() and emits \'offline\'', async function () {
    const app = new App();
    
    const listener = sinon.spy();
    sinon.stub(app, 'destroy').resolves();
    
    app.on('offline', listener);
    await app.shutdown();
    
    expect(app.destroy.calledOnce).to.be.true;
    expect(listener.calledOnce).to.be.true;
    expect(app.destroy.calledBefore(listener)).to.be.true;
  });
});
