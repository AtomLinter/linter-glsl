"use babel";

path = require('path');

describe('linter-glsl', () => {
  const lint = require('../lib/linter-glsl').provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-glsl");
    })
  })

  var vTest = (messages) => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'main' : illegal use of type 'void'");

    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'' :  syntax error");
  }

  var fTest = (messages) => {
    expect(messages.length).toEqual(2);

    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'vec5' : no matching overloaded function found");

    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'assign' :  cannot convert from 'const float' to 'fragColor 4-component vector of float FragColor'");
  }

  var gTest = (messages) => {
    expect(messages.length).toEqual(1);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'line_stripp' : unrecognized layout identifier, or qualifier requires assignment (e.g., binding = 4)");
  }

  var vLint = (editor) => lint(editor).then(vTest);
  var fLint = (editor) => lint(editor).then(fTest);
  var gLint = (editor) => lint(editor).then(gTest);

  // Linking test

  it('links multiple shaders together', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}linking${path.sep}test.vert`).then((editor) => {
      atom.config.set("linter-glsl.linkSimilarShaders", true)
      lint(editor).then((messages) => {
        expect(messages.length).toEqual(2);
        expect(messages[0].type).toEqual("ERROR");
        expect(messages[0].text).toEqual("Missing entry point: Each stage requires one \"void main()\" entry point");
        expect(messages[1].type).toEqual("ERROR");
        expect(messages[1].text).toEqual("Missing entry point: Each stage requires one \"void main()\" entry point");
      });
    }))
  });

  // Vertex shaders

  it('finds two errors in "test.vert"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vert`).then(vLint))
  });

  it('finds two errors in "test.v.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.v.glsl`).then(vLint))
  });

  it('finds two errors in "test.vs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vs.glsl`).then(vLint))
  });

  it('finds two errors in "test_v.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test_v.glsl`).then(vLint))
  });

  it('finds two errors in "test_vs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test_vs.glsl`).then(vLint))
  });

  it('finds two errors in "test.vs"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vs`).then(vLint))
  });

  it('finds two errors in "test.vsh"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vsh`).then(vLint))
  });

  it('finds two errors in "test.vshader"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vshader`).then(vLint))
  });

  // Fragment shaders

  it('finds two errors in "test.frag"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.frag`).then(fLint))
  })

  it('finds two errors in "test.f.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.f.glsl`).then(fLint))
  })

  it('finds two errors in "test.fs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fs.glsl`).then(fLint))
  })

  it('finds two errors in "test_f.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test_f.glsl`).then(fLint))
  })

  it('finds two errors in "test_fs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test_fs.glsl`).then(fLint))
  })

  it('finds two errors in "test.fs"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fs`).then(fLint))
  })

  it('finds two errors in "test.fsh"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fsh`).then(fLint))
  })

  it('finds two errors in "test.fshader"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fshader`).then(fLint))
  })

  // Geometry shaders

  it('finds two errors in "test.geom"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.geom`).then(gLint))
  })

  it('finds two errors in "test.g.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.g.glsl`).then(gLint))
  })

  it('finds two errors in "test.gs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gs.glsl`).then(gLint))
  })

  it('finds two errors in "test_g.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test_g.glsl`).then(gLint))
  })

  it('finds two errors in "test_gs.glsl"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test_gs.glsl`).then(gLint))
  })

  it('finds two errors in "test.gs"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gs`).then(gLint))
  })

  it('finds two errors in "test.gsh"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gsh`).then(gLint))
  })

  it('finds two errors in "test.gshader"', () => {
    waitsForPromise(() => atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gshader`).then(gLint))
  })
});
