"use babel";

path = require('path');

describe('linter-glsl', () => {
  const lint = require('../lib/linter-glsl').provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-glsl");
    })
  });

  const vsTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'main' : illegal use of type 'void'");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'' :  syntax error");
  };

  const fsTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'vec5' : no matching overloaded function found");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'assign' :  cannot convert from 'const float' to 'fragColor 4-component vector of float FragColor'");
  };

  const gsTest = messages => {
    expect(messages.length).toEqual(1);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'line_stripp' : unrecognized layout identifier, or qualifier requires assignment (e.g., binding = 4)");
  };

  const tcTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'verticaes' : there is no such layout identifier for this stage taking an assigned value");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'' :  syntax error");
  };

  const teTest = messages => {
    expect(messages.length).toEqual(1);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'' :  syntax error");
  };

  const csTest = messages => {
    expect(messages.length).toEqual(1);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'' : image variables not declared 'writeonly' must have a format layout qualifier");
  };

  const runLintTest = shaderTest => editor => lint(editor).then(shaderTest);

  // Linking test

  it('links multiple shaders together', () => {
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}linking${path.sep}test.vert`)
      .then(editor => {
        atom.config.set("linter-glsl.linkSimilarShaders", true)
        lint(editor)
          .then(messages => {
            expect(messages.length).toEqual(2);
            expect(messages[0].type).toEqual("ERROR");
            expect(messages[0].text).toEqual("Missing entry point: Each stage requires one \"void main()\" entry point");
            expect(messages[1].type).toEqual("ERROR");
            expect(messages[1].text).toEqual("Missing entry point: Each stage requires one \"void main()\" entry point");
          });
      }));
  });

  // Vertex shaders

  it('finds two errors in "test.vert"', _ => {
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vert`)
      .then(runLintTest(vsTest)));
  });

  it('finds two errors in "test.vs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vs.glsl`)
      .then(runLintTest(vsTest))));

  it('finds two errors in "test.vs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}vert${path.sep}test.vs`)
      .then(runLintTest(vsTest))));

  // Fragment shaders

  it('finds two errors in "test.frag"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.frag`)
      .then(runLintTest(fsTest))));

  it('finds two errors in "test.fs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fs.glsl`)
      .then(runLintTest(fsTest))));

  it('finds two errors in "test.fs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}frag${path.sep}test.fs`)
      .then(runLintTest(fsTest))));

  // Geometry shaders

  it('finds two errors in "test.geom"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.geom`)
      .then(runLintTest(gsTest))));

  it('finds two errors in "test.gs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gs.glsl`)
      .then(runLintTest(gsTest))));

  it('finds two errors in "test.gs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}geom${path.sep}test.gs`)
      .then(runLintTest(gsTest))));

  // Tessellation Control shaders

  it('finds two errors in "test.tesc"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tesc${path.sep}test.tesc`)
      .then(runLintTest(tcTest))));

  it('finds two errors in "test.tc.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tesc${path.sep}test.tc.glsl`)
      .then(runLintTest(tcTest))));

  it('finds two errors in "test.tc"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tesc${path.sep}test.tc`)
      .then(runLintTest(tcTest))));

  // Tessellation Evaluation shaders

  it('finds two errors in "test.tese"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tese${path.sep}test.tese`)
      .then(runLintTest(teTest))));

  it('finds two errors in "test.te.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tese${path.sep}test.te.glsl`)
      .then(runLintTest(teTest))));

  it('finds two errors in "test.te"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}tese${path.sep}test.te`)
      .then(runLintTest(teTest))));

  // Compute shaders

  it('finds two errors in "test.comp"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}comp${path.sep}test.comp`)
      .then(runLintTest(csTest))));

  it('finds two errors in "test.cs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}comp${path.sep}test.cs.glsl`)
      .then(runLintTest(csTest))));

  it('finds two errors in "test.cs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(__dirname + `${path.sep}fixtures${path.sep}comp${path.sep}test.cs`)
      .then(runLintTest(csTest))));
});
