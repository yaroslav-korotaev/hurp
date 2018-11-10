// Importing 'jest-extended' explicitly for VS Code IntelliSense support until the better solution
// is found
// tslint:disable-next-line:no-import-side-effect
import 'jest-extended';
import foo from '../index';

describe('foo', () => {
  test('returns foo', () => {
    expect(foo()).toBe('foo');
  });
});
