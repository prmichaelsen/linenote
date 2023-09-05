import { escapeRegex, isValidFilePath } from '../util';
import * as assert from "assert";

suite("util", function() {

  suite("escapeRegex", function() {
    test('should escape [] characters', () => {
      const input = '[world]';
      const result = escapeRegex(input);
      assert.equal(result, '\\[world\\]');
    });

    test('should escape special characters', () => {
      const input = 'Hello [world]';
      const result = escapeRegex(input);
      assert.equal(result, 'Hello \\[world\\]');
    });

    test('should escape period', () => {
      const input = 'Example.com';
      const result = escapeRegex(input);
      assert.equal(result, 'Example\\.com');
    });

    test('should escape multiple special characters in the string', () => {
      const input = 'This is a *test* of $escaping^.';
      const result = escapeRegex(input);
      assert.equal(result, 'This is a \\*test\\* of \\$escaping\\^\\.');
    });

    test('should return an empty string if input is empty', () => {
      const input = '';
      const result = escapeRegex(input);
      assert.equal(result, '');
    });

    test('should handle input with no special characters', () => {
      const input = 'No special characters here';
      const result = escapeRegex(input);
      assert.equal(result, 'No special characters here');
    });
  });

  // tests designed for Unix-like system
  suite('isValidFilePath', () => {
    const tests = [
      { args: 'Text_One', expected: true },
      { args: 'Text.One', expected: true },
      { args: 'Text-Test.One', expected: true },
      { args: '-', expected: true },
      { args: '.;*&%^+=@#$~`,[]{}()!;"\'*?<>', expected: true },
      { args: ' Test ', expected: true },
      { args: 'Test ', expected: true },
      { args: ' Test', expected: true },
      { args: ' ', expected: false },
      { args: '  ', expected: false },
      // note:rm37f1tWKRaWEqD2st56zt [Edit] [Remove]
      // vscode allows:
      { args: ':', expected: true },
      { args: '\\', expected: true },
      { args: '/', expected: true },
      { args: '/test', expected: true },
      { args: '/test/one', expected: true },
      { args: '/test/one/two/', expected: true },
      { args: './test/one/two/', expected: true },
      { args: '../test/one/two/', expected: true },
      { args: '', expected: false },
      { args: null as any, expected: false },
      { args: undefined as any, expected: false },
    ];

    tests.forEach(({args, expected}) => {
      test(`"${args}"`, function () {
        assert.equal(isValidFilePath(args), expected);
      });
    });
  });
});