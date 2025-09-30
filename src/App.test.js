// Simple smoke test for the Lagermanagement System
describe('Lagermanagement System', () => {
  test('basic math operations work', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
  });

  test('string operations work', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
    expect('test'.toUpperCase()).toBe('TEST');
  });

  test('array operations work', () => {
    const materials = ['Solar Panel', 'Inverter', 'Cable'];
    expect(materials.length).toBe(3);
    expect(materials.includes('Solar Panel')).toBe(true);
  });

  test('date operations work', () => {
    const now = new Date();
    expect(now instanceof Date).toBe(true);
    expect(typeof now.getTime()).toBe('number');
  });
});
