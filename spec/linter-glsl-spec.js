"use babel";

describe('linter-glsl', () => {
  const lint = require('../lib/linter-glsl').provideLinter().lint

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-glsl")
    })
  })

  it('finds two errors in "test.vert"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/fixtures/test.vert').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(2)
          expect(messages[0].type).toEqual("ERROR")
          expect(messages[0].text).toEqual("'main' : illegal use of type 'void'")

          expect(messages[1].type).toEqual("ERROR")
          expect(messages[1].text).toEqual("'' :  syntax error")
        })
      })
    })
  })

  it('finds two errors in "test.frag"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/fixtures/test.frag').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(2)
          expect(messages[0].type).toEqual("ERROR")
          expect(messages[0].text).toEqual("'vec5' : no matching overloaded function found")

          expect(messages[1].type).toEqual("ERROR")
          expect(messages[1].text).toEqual("'assign' :  cannot convert from 'const float' to 'fragColor 4-component vector of float FragColor'")
        })
      })
    })
  })
});
