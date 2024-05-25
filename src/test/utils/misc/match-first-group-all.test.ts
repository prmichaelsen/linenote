import * as assert from "assert";
import { matchFirstGroupAll } from "../../../utils/misc/match-first-group-all";

suite('matchFirstGroupAll', () => {

  test('should return an empty array when no matches are found', () => {
    const input = 'This is a test string';
    const regex = /abc/g; // non-matching regex pattern

    const result = matchFirstGroupAll(input, regex);

    assert.deepEqual(result, []);
  });

  suite('should return an array of matches for the first capturing group', () => {

    test('single line', () => {
      const input = 'Hello [Edit] World [Remove] Foo [Edit] Bar [Remove]';
      const regex = /\[(.*?)\]/g; // matches strings inside square brackets

      const result = matchFirstGroupAll(input, regex);

      assert.deepEqual(result, ['Edit', 'Remove', 'Edit', 'Remove']);
    });

    test('multiline', () => {
      const input = 'Hello [Edit]\n World [Remove]\n Foo [Edit] Bar [Remove]';
      const regex = /\[(.*?)\]/gm; // matches strings inside square brackets

      const result = matchFirstGroupAll(input, regex);

      assert.deepEqual(result,['Edit', 'Remove', 'Edit', 'Remove']);
    });
  });

  test('should handle null and undefined matches', () => {
    const input = 'Lorem ipsum dolor';
    const regex = /(missing)/g; // non-matching regex pattern

    const result = matchFirstGroupAll(input, regex);

    assert.deepEqual(result, []);
  });

});