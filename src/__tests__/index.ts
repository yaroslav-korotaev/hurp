import foo from '../index';

describe('foo', () => {
  test('returns foo', () => {
    expect(foo()).toBe('foo');
  });
});
