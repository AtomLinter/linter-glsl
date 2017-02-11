var path = require('path');

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
    expect(messages[1].text).toEqual("'' : compilation terminated");
  };

  const fsTest = messages => {
    expect(messages.length).toEqual(3);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'vec5' : no matching overloaded function found");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'assign' :  cannot convert from 'const float' to 'fragColor 4-component vector of float FragColor'");
    expect(messages[2].type).toEqual("ERROR");
    expect(messages[2].text).toEqual("'' : compilation terminated");
  };

  const gsTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'line_stripp' : unrecognized layout identifier, or qualifier requires assignment (e.g., binding = 4)");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'' : compilation terminated");
  };

  const tcTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'verticaes' : there is no such layout identifier for this stage taking an assigned value");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'' : compilation terminated");
  };

  const teTest = messages => {
    expect(messages.length).toEqual(1);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'' :  syntax error");
  };

  const csTest = messages => {
    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual("ERROR");
    expect(messages[0].text).toEqual("'' : image variables not declared 'writeonly' must have a format layout qualifier");
    expect(messages[1].type).toEqual("ERROR");
    expect(messages[1].text).toEqual("'compute shaders' : required extension not requested: GL_ARB_compute_shader");
  };

  const runLintTest = shaderTest => editor => lint(editor).then(shaderTest);

  // Linking test

  it('links multiple shaders together when there are linker errors', () => {
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "linking", "sample.vert"))
      .then(editor => {
        atom.config.set("linter-glsl.linkSimilarShaders", true)
        return lint(editor)
          .then(messages => {
            expect(messages.length).toEqual(2);
            expect(messages[0].type).toEqual("ERROR");
            expect(messages[0].text).toEqual("Missing entry point: Each stage requires one entry point");
            expect(messages[1].type).toEqual("ERROR");
            expect(messages[1].text).toEqual("Missing entry point: Each stage requires one entry point");
          });
      }));
  });

  // Vertex shaders

  it('finds two errors in "sample.vert"', _ => {
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample.vert"))
      .then(runLintTest(vsTest)));
  });

  it('finds two errors in "sample.vs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample.vs.glsl"))
      .then(runLintTest(vsTest))));

  it('finds two errors in "sample_vs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample_vs.glsl"))
      .then(runLintTest(vsTest))));

  it('finds two errors in "sample.vs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample.vs"))
      .then(runLintTest(vsTest))));

  it('finds two errors in "sample.v.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample.v.glsl"))
      .then(runLintTest(vsTest))));

  it('finds two errors in "sample_v.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample_v.glsl"))
      .then(runLintTest(vsTest))));

  it('finds two errors in "sample.vsh"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "vert", "sample.vsh"))
      .then(runLintTest(vsTest))));

  // Fragment shaders

  it('finds two errors in "sample.frag"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample.frag"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample.fs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample.fs.glsl"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample_fs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample_fs.glsl"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample.fs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample.fs"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample.f.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample.f.glsl"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample_f.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample_f.glsl"))
      .then(runLintTest(fsTest))));

  it('finds two errors in "sample.fsh"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "frag", "sample.fsh"))
      .then(runLintTest(fsTest))));

  // Geometry shaders

  it('finds two errors in "sample.geom"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample.geom"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample.gs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample.gs.glsl"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample_gs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample_gs.glsl"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample.gs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample.gs"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample.g.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample.g.glsl"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample_g.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample_g.glsl"))
      .then(runLintTest(gsTest))));

  it('finds two errors in "sample.gsh"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "geom", "sample.gsh"))
      .then(runLintTest(gsTest))));

  // Tessellation Control shaders

  it('finds two errors in "sample.tesc"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tesc", "sample.tesc"))
      .then(runLintTest(tcTest))));

  it('finds two errors in "sample.tc.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tesc", "sample.tc.glsl"))
      .then(runLintTest(tcTest))));

  it('finds two errors in "sample_tc.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tesc", "sample_tc.glsl"))
      .then(runLintTest(tcTest))));

  it('finds two errors in "sample.tc"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tesc", "sample.tc"))
      .then(runLintTest(tcTest))));

  // Tessellation Evaluation shaders

  it('finds two errors in "sample.tese"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tese", "sample.tese"))
      .then(runLintTest(teTest))));

  it('finds two errors in "sample.te.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tese", "sample.te.glsl"))
      .then(runLintTest(teTest))));

  it('finds two errors in "sample_te.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tese", "sample_te.glsl"))
      .then(runLintTest(teTest))));

  it('finds two errors in "sample.te"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "tese", "sample.te"))
      .then(runLintTest(teTest))));

  // Compute shaders

  it('finds two errors in "sample.comp"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "comp", "sample.comp"))
      .then(runLintTest(csTest))));

  it('finds two errors in "sample.cs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "comp", "sample.cs.glsl"))
      .then(runLintTest(csTest))));

  it('finds two errors in "sample_cs.glsl"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "comp", "sample_cs.glsl"))
      .then(runLintTest(csTest))));

  it('finds two errors in "sample.cs"', _ =>
    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, "fixtures", "comp", "sample.cs"))
      .then(runLintTest(csTest))));
});
