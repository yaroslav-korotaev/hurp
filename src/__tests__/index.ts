import Hurp from '../index';

function createModule(marks: string[], prefix: string) {
  return {
    init: jest.fn(async () => { marks.push(`${prefix}-init`); }),
    destroy: jest.fn(async () => { marks.push(`${prefix}-destroy`); }),
  };
}

describe('Hurp', () => {
  test('initializes modules', async () => {
    const marks = [] as string[];
    const a = createModule(marks, 'a');
    const b = createModule(marks, 'b');
    
    const app = new Hurp();
    app.use(a);
    app.use(b);
    
    await app.init();
    
    expect(marks).toEqual(['a-init', 'b-init']);
  });
  
  test('destroying modules in revese order', async () => {
    const marks = [] as string[];
    const a = createModule(marks, 'a');
    const b = createModule(marks, 'b');
    
    const app = new Hurp();
    app.use(a);
    app.use(b);
    
    await app.destroy();
    
    expect(marks).toEqual(['b-destroy', 'a-destroy']);
  });
});
