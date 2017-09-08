'use babel';

// eslint-disable-next-line no-unused-vars
import { it, fit, wait, beforeEach, afterEach } from 'jasmine-fix';
import { join } from 'path';

const { lint } = require('../lib/linter-glsl').provideLinter();

const runLint = async (path) => {
  const editor = await atom.workspace.open(path);
  return lint(editor);
};

const vsTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'vert', fileName));
  expect(messages.length).toEqual(2);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'main' : illegal use of type 'void'");
  expect(messages[1].type).toEqual('ERROR');
  expect(messages[1].text).toEqual("'' : compilation terminated");
};

const fsTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'frag', fileName));
  expect(messages.length).toEqual(3);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'vec5' : no matching overloaded function found");
  expect(messages[1].type).toEqual('ERROR');
  expect(messages[1].text).toEqual("'assign' :  cannot convert from ' const float' to ' fragColor 4-component vector of float FragColor'");
  expect(messages[2].type).toEqual('ERROR');
  expect(messages[2].text).toEqual("'' : compilation terminated");
};

const gsTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'geom', fileName));
  expect(messages.length).toEqual(2);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'line_stripp' : unrecognized layout identifier, or qualifier requires assignment (e.g., binding = 4)");
  expect(messages[1].type).toEqual('ERROR');
  expect(messages[1].text).toEqual("'' : compilation terminated");
};

const tcTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'tesc', fileName));
  expect(messages.length).toEqual(2);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'verticaes' : there is no such layout identifier for this stage taking an assigned value");
  expect(messages[1].type).toEqual('ERROR');
  expect(messages[1].text).toEqual("'' : compilation terminated");
};

const teTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'tese', fileName));
  expect(messages.length).toEqual(1);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'' :  syntax error, unexpected IDENTIFIER");
};

const csTest = async (fileName) => {
  const messages = await runLint(join(__dirname, 'fixtures', 'comp', fileName));
  expect(messages.length).toEqual(2);
  expect(messages[0].type).toEqual('ERROR');
  expect(messages[0].text).toEqual("'image variables not declared 'writeonly' and without a format layout qualifier' : not supported for this version or the enabled extensions");
  expect(messages[1].type).toEqual('ERROR');
  expect(messages[1].text).toEqual("'compute shaders' : required extension not requested: GL_ARB_compute_shader");
};

describe('linter-glsl', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('linter-glsl');
  });

  // Linking test

  it('links multiple shaders together when there are linker errors', async () => {
    atom.config.set('linter-glsl.linkSimilarShaders', true);

    const linkingPath = join(__dirname, 'fixtures', 'linking');
    const editor = await atom.workspace.open(join(linkingPath, 'sample.vert'));
    const messages = await lint(editor);

    expect(messages.length).toEqual(2);
    expect(messages[0].type).toEqual('ERROR');
    expect(messages[0].text).toEqual('Missing entry point: Each stage requires one entry point');
    expect(messages[1].type).toEqual('ERROR');
    expect(messages[1].text).toEqual('Missing entry point: Each stage requires one entry point');
  });

  // Vertex shaders

  it('finds two errors in "sample.vert"', async () => {
    await vsTest('sample.vert');
  });

  it('finds two errors in "sample.vs.glsl"', async () => {
    await vsTest('sample.vs.glsl');
  });

  it('finds two errors in "sample_vs.glsl"', async () => {
    await vsTest('sample_vs.glsl');
  });

  it('finds two errors in "sample.vs"', async () => {
    await vsTest('sample.vs');
  });

  it('finds two errors in "sample.v.glsl"', async () => {
    await vsTest('sample.v.glsl');
  });

  it('finds two errors in "sample_v.glsl"', async () => {
    await vsTest('sample_v.glsl');
  });

  it('finds two errors in "sample.vsh"', async () => {
    await vsTest('sample.vsh');
  });

  // Fragment shaders

  it('finds two errors in "sample.frag"', async () => {
    await fsTest('sample.frag');
  });

  it('finds two errors in "sample.fs.glsl"', async () => {
    await fsTest('sample.fs.glsl');
  });

  it('finds two errors in "sample_fs.glsl"', async () => {
    await fsTest('sample_fs.glsl');
  });

  it('finds two errors in "sample.fs"', async () => {
    await fsTest('sample.fs');
  });

  it('finds two errors in "sample.f.glsl"', async () => {
    await fsTest('sample.f.glsl');
  });

  it('finds two errors in "sample_f.glsl"', async () => {
    await fsTest('sample_f.glsl');
  });

  it('finds two errors in "sample.fsh"', async () => {
    await fsTest('sample.fsh');
  });

  // Geometry shaders

  it('finds two errors in "sample.geom"', async () => {
    await gsTest('sample.geom');
  });

  it('finds two errors in "sample.gs.glsl"', async () => {
    await gsTest('sample.gs.glsl');
  });

  it('finds two errors in "sample_gs.glsl"', async () => {
    await gsTest('sample_gs.glsl');
  });

  it('finds two errors in "sample.gs"', async () => {
    await gsTest('sample.gs');
  });

  it('finds two errors in "sample.g.glsl"', async () => {
    await gsTest('sample.g.glsl');
  });

  it('finds two errors in "sample_g.glsl"', async () => {
    await gsTest('sample_g.glsl');
  });

  it('finds two errors in "sample.gsh"', async () => {
    await gsTest('sample.gsh');
  });

  // Tessellation Control shaders

  it('finds two errors in "sample.tesc"', async () => {
    await tcTest('sample.tesc');
  });

  it('finds two errors in "sample.tc.glsl"', async () => {
    await tcTest('sample.tc.glsl');
  });

  it('finds two errors in "sample_tc.glsl"', async () => {
    await tcTest('sample_tc.glsl');
  });

  it('finds two errors in "sample.tc"', async () => {
    await tcTest('sample.tc');
  });

  // Tessellation Evaluation shaders

  it('finds two errors in "sample.tese"', async () => {
    await teTest('sample.tese');
  });

  it('finds two errors in "sample.te.glsl"', async () => {
    await teTest('sample.te.glsl');
  });

  it('finds two errors in "sample_te.glsl"', async () => {
    await teTest('sample_te.glsl');
  });

  it('finds two errors in "sample.te"', async () => {
    await teTest('sample.te');
  });

  // Compute shaders

  it('finds two errors in "sample.comp"', async () => {
    await csTest('sample.comp');
  });

  it('finds two errors in "sample.cs.glsl"', async () => {
    await csTest('sample.cs.glsl');
  });

  it('finds two errors in "sample_cs.glsl"', async () => {
    await csTest('sample_cs.glsl');
  });

  it('finds two errors in "sample.cs"', async () => {
    await csTest('sample.cs');
  });
});
