// Importing 'jest-extended' explicitly for VS Code IntelliSense support until the better solution
// is found
// tslint:disable-next-line:no-import-side-effect
import 'jest-extended';
import Hurp from '../index';

function createModule() {
  return {
    init: jest.fn(async () => { /* empty */ }),
    destroy: jest.fn(async () => { /* empty */ }),
  };
}

describe('Hurp', () => {
  test('initializes modules', async () => {
    const a = createModule();
    const b = createModule();
    
    const app = new Hurp();
    app.use(a);
    app.use(b);
    
    await app.init();
    
    expect(a.init).toHaveBeenCalled();
    expect(b.init).toHaveBeenCalled();
    expect(a.init).toHaveBeenCalledBefore(b.init);
  });
  
  test('destroying modules in revese order', async () => {
    const a = createModule();
    const b = createModule();
    
    const app = new Hurp();
    app.use(a);
    app.use(b);
    
    await app.destroy();
    
    expect(a.destroy).toHaveBeenCalled();
    expect(b.destroy).toHaveBeenCalled();
    expect(b.destroy).toHaveBeenCalledBefore(a.destroy);
  });
});
