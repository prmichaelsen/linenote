import * as assert from "assert";
import { getNoteMarkerRegex, getUuidFromNoteMarker } from "../../../utils/helpers/match-helpers";

suite("match-helpers", function() {
  suite("getNoteMarkerRegex", function() {
    test('produces correct regex', () => {
      assert.equal(
        getNoteMarkerRegex().toString(),
        /note: *[^ ].+(?=\[Edit\] \[Remove\])/gm.toString(),
      );
    });

    suite('test note marker regex', () => {
      const regexTests = [
        { args: '// note:Text_One [Edit] [Remove]', expected: true },
        { args: '// note:Text.One [Edit] [Remove]', expected: true },
        { args: '// note:Text-Test.One [Edit] [Remove]', expected: true },
        { args: '// note:- [Edit] [Remove]', expected: true },
        { args: '// note:.;*&%^+=@#$~`,[]{}()!;"\'*?<> [Edit] [Remove]', expected: true },
        { args: '// note:  [Edit] [Remove]', expected: false },
        { args: '// note:: [Edit] [Remove]', expected: true },
        { args: '// note:/ [Edit] [Remove]', expected: true },
        { args: '// note:\\ [Edit] [Remove]', expected: true },
      ];

      regexTests.forEach(({args, expected}) => {
        test(`correctly tests regex`, function () {
          const regexArr = args.match(getNoteMarkerRegex());
          const match = regexArr ? regexArr[0] : null;
          const res = (
            match !== undefined && match !== null && match.trim() !== ''
          );
          assert.equal(res, expected, `"${args}"`);
        });
      });
    });
  });

  suite('test getUuidFromNoteMarker', () => {
    const tests = [
      { args: '// note:Text_One [Edit] [Remove] ',                        expected: 'Text_One' },
      { args: '// note:Text.One [Edit] [Remove] ',                        expected: 'Text.One' },
      { args: '// note:Text-Test.One [Edit] [Remove] ',                   expected: 'Text-Test.One' },
      { args: '// note:- [Edit] [Remove] ',                               expected: '-' },
      { args: '// note:.;*&%^+=@#$~`,[]{}()!;"\'*?<> [Edit] [Remove] ',   expected: '.;*&%^+=@#$~`,[]{}()!;"\'*?<>' },
      { args: '// note:  [Edit] [Remove] ',                               expected: null },
      { args: '// note:   [Edit] [Remove] ',                              expected: null },
      { args: '// note:: [Edit] [Remove] ',                               expected: ":" },
      { args: '// note:/ [Edit] [Remove] ',                               expected: null },
      { args: '// note:/note [Edit] [Remove] ',                           expected: 'note' },
      { args: '// note:/path/to/note [Edit] [Remove] ',                   expected: 'path/to/note' },
      { args: '// note:path/to/note [Edit] [Remove] ',                    expected: 'path/to/note' },
      { args: '// note:path/to/note/ [Edit] [Remove] ',                   expected: 'path/to/note' },
      { args: '// note:\\ [Edit] [Remove] ',                              expected: "\\" },
    ];

    tests.forEach(({args, expected}) => {
      test(`tests "${args}" ${expected === null ? 'does not match' : 'matches'}`, function () {

        const uuid = getUuidFromNoteMarker(args);
        assert.equal(uuid, expected);
      });
    });
  });
});