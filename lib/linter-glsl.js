"use babel"

const os = require("os");
const fs = require('fs');
const path = require('path');
const which = require('which');

const char1glslRegex = /^(.*(?:\.|_))(v|g|f)(\.glsl)$/
const char2glslRegex = /^(.*(?:\.|_))(vs|tc|te|gs|fs|cs)(\.glsl)$/
const char1shRegex = /^(.*\.)(v|g|f)sh$/
const char2Regex = /^(.*\.)(vs|tc|te|gs|fs|cs)$/
const defaultRegex = /^(.*\.)(vert|frag|geom|tesc|tese|comp)$/

const compileRegex = "^([\\w \\-]+): (\\d+):(\\d+): (.*)$";
const linkRegex = "^([\\w \\-]+): Linking {{typeName}} stage: (.*)$";

const shaderTypes = [{
  'char1': 'v',
  'char2': 'vs',
  'char4': 'vert',
  'name': 'vertex'
}, {
  'char1': 'f',
  'char2': 'fs',
  'char4': 'frag',
  'name': 'fragment'
}, {
  'char1': 'g',
  'char2': 'gs',
  'char4': 'geom',
  'name': 'geometry'
}, {
  'char2': 'te',
  'char4': 'tese',
  'name': 'tessellation evaluation'
}, {
  'char2': 'tc',
  'char4': 'tesc',
  'name': 'tessellation control'
}, {
  'char2': 'cs',
  'char4': 'comp',
  'name': 'compute'
}];

const shaderTypeLookup = (fieldName, fieldValue) =>
  shaderTypes.filter(shaderType => shaderType[fieldName] == fieldValue)[0];

const shaderByChar1 = char1 => shaderTypeLookup('char1', char1);
const shaderByChar2 = char2 => shaderTypeLookup('char2', char2);
const shaderByChar4 = char4 => shaderTypeLookup('char4', char4);
const shaderByName = name => shaderTypeLookup('name', name);

const parseGlslValidatorResponse = (inputs, output) => new Promise((resolve, reject) => {
  const toReturn = [];

  var currentShader;

  inputs.forEach(shader => {
    var compileStarted = false;
    var linkStarted = false;
    var typeName = shader.type.name;

    output.split(os.EOL).forEach(line => {
      if (line.endsWith(shader.name)) {
        compileStarted = true;
      } else if (compileStarted || inputs.length == 1) {
        var match = new RegExp(compileRegex).exec(line)
        if (match) {
          const lineStart = parseInt(match[3])
          const colStart = parseInt(match[2])
          const lineEnd = lineStart
          const colEnd = colStart

          toReturn.push({
            type: match[1],
            text: match[4].trim(),
            filePath: shader.fullFilename,
            range: [
              [lineStart > 0 ? lineStart - 1 : 0, colStart > 0 ? colStart - 1 : 0],
              [lineEnd > 0 ? lineEnd - 1 : 0, colEnd > 0 ? colEnd - 1 : 0]
            ]
          });
        } else {
          compileStarted = false;
        }
      }

      if (line.trim() == `Linked ${typeName} stage:`) {
        compileStarted = false;
        linkStarted = true;
      } else if (linkStarted) {
        const match = new RegExp(linkRegex.replace("{{typeName}}", typeName)).exec(line)
        if (match) {
          toReturn.push({
            type: match[1],
            text: match[2].trim(),
            filePath: shader.fullFilename,
            range: [
              [0, 0],
              [0, 0]
            ]
          });
        } else if (line.trim().length > 0) {
          linkStarted = false;
        }
      }
    })
  })
  resolve(toReturn);
});

const extractShaderFilenameTokens = shaderFilename => {
  const fileName = path.basename(shaderFilename)
  const dirName = path.dirname(shaderFilename)

  var baseFilename;
  var baseShaderType;
  var baseExtension;

  var linkTargetPattern;
  var linkTargets;

  const extChar1GlslMatch = char1glslRegex.exec(fileName);
  const extChar2GlslMatch = char2glslRegex.exec(fileName);
  const extChar2Match = char2Regex.exec(fileName);
  const extChar1ShMatch = char1shRegex.exec(fileName);
  const extDefaultMatch = defaultRegex.exec(fileName);

  if (extChar1GlslMatch) {
    baseFilename = extChar1GlslMatch[1];
    baseShaderType = shaderByChar1(extChar1GlslMatch[2]);
    baseExtension = extChar1GlslMatch[3];

    linkTargets = shaderTypes.filter(shaderType => shaderType != baseShaderType);
    linkTargetPattern = `${baseFilename}{{char1}}${baseExtension}`;
  } else if (extChar2GlslMatch) {
    baseFilename = extChar2GlslMatch[1];
    baseShaderType = shaderByChar2(extChar2GlslMatch[2]);
    baseExtension = extChar2GlslMatch[3];

    linkTargets = shaderTypes.filter(shaderType => shaderType != baseShaderType);
    linkTargetPattern = `${baseFilename}{{char2}}${baseExtension}`;
  } else if (extChar1ShMatch) {
    baseFilename = extChar1ShMatch[1];
    baseShaderType = shaderByChar1(extChar1ShMatch[2]);
    baseExtension = extChar1ShMatch[3];

    linkTargets = shaderTypes.filter(shaderType => shaderType != baseShaderType);
    linkTargetPattern = `${baseFilename}{{char1}}${baseExtension}`;
  } else if (extChar2Match) {
    baseFilename = extChar2Match[1];
    baseShaderType = shaderByChar2(extChar2Match[2]);
    baseExtension = extChar2Match[3];

    linkTargets = shaderTypes.filter(shaderType => shaderType != baseShaderType);
    linkTargetPattern = `${baseFilename}{{char2}}${baseExtension}`;
  } else if (extDefaultMatch) {
    baseFilename = extDefaultMatch[1];
    baseShaderType = shaderByChar4(extDefaultMatch[2]);
    baseExtension = extDefaultMatch[2];

    linkTargets = shaderTypes.filter(shaderType => shaderType != baseShaderType);
    linkTargetPattern = `${baseFilename}{{char4}}`
  } else {
    throw "Unknown shader type"
  }

  var outFilename = baseFilename;
  if (!outFilename.endsWith(".")) outFilename += ".";

  outFilename += baseShaderType.char4;

  return {
    linkTargets: linkTargets,
    linkTargetPattern: linkTargetPattern,
    baseFilename: baseFilename,
    baseShaderType: baseShaderType,
    dirName: dirName,
    outFilename: outFilename,
    fullFilename: shaderFilename
  };
};

export default {
  config: {
    glslangValidatorPath: {
      type: "string",
      default: "glslangValidator",
      order: 1
    },
    linkSimilarShaders: {
      type: "boolean",
      default: false,
      order: 2
    }
  },

  activate: _ => {
    require("atom-package-deps").install("linter-glsl");

    CompositeDisposable = require('atom').CompositeDisposable;
    MessagePanelView = require('atom-message-panel').MessagePanelView;
    PlainMessageView = require('atom-message-panel').PlainMessageView;

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-glsl.linkSimilarShaders', (linkSimilarShaders) => {
        this.linkSimilarShaders = linkSimilarShaders;
      })
    );

    this.subscriptions.add(
      atom.config.observe('linter-glsl.glslangValidatorPath', (glslangValidatorPath) => {
        this.glslangValidatorPath = module.exports.config.glslangValidatorPath.default;
        if (fs.existsSync(glslangValidatorPath) && fs.statSync(glslangValidatorPath).isFile()) {
          try {
            fs.accessSync(glslangValidatorPath, fs.X_OK);
            this.glslangValidatorPath = glslangValidatorPath;
          } catch (error) {
            console.log(error);
          }
        } else {
          try {
            this.glslangValidatorPath = which.sync(glslangValidatorPath);
          } catch(error) {
            console.log(error);
          }
        }

        if (this.glslangValidatorPath) {
          if (this.messages) {
            this.messages.close();
            this.messages = undefined;
          }
        } else {
          if (!this.messages) {
            this.messages = new MessagePanelView({
              title: "linter-glsl"
            });
            this.messages.attach();
            this.messages.toggle();
          }
          this.messages.clear();
          this.messages.add(new PlainMessageView({
            message: `Unable to locate glslangValidator at '${glslangValidatorPath}'`,
            className: 'text-error'
          }));
        }
      }));
  },

  deactivate: _ => {
    this.subscriptions.dispose();
  },

  provideLinter: _ => {
    const helpers = require("atom-linter");

    return {
      name: "glsl",
      grammarScopes: ["source.glsl"],
      scope: "file",
      lintOnFly: true,
      lint: (activeEditor) => {
        const file = activeEditor.getPath();
        const content = activeEditor.getText();
        var command = this.glslangValidatorPath;

        if (this.glslangValidatorPath == undefined) {
          command = module.exports.config.glslangValidatorPath.default;
        }

        const shaderFileTokens = extractShaderFilenameTokens(file);

        var filesToValidate = [{
          'name': shaderFileTokens.outFilename,
          'fullFilename': file,
          'type': shaderFileTokens.baseShaderType,
          'contents': content
        }];
        var args = [];
        var results;

        if (this.linkSimilarShaders) {
          filesToValidate = filesToValidate.concat(shaderFileTokens.linkTargets
            .map(target => shaderFileTokens.linkTargetPattern
              .replace("{{char1}}", target.char1)
              .replace("{{char2}}", target.char2)
              .replace("{{char4}}", target.char4))
            .map(shader => path.join(shaderFileTokens.dirName, shader))
            .filter(fs.existsSync)
            .map(extractShaderFilenameTokens)
            .map(shader => {
              return {
                'name': shader.outFilename,
                'fullFilename': shader.fullFilename,
                'type': shader.baseShaderType,
                'contents': fs.readFileSync(shader.fullFilename, "UTF-8")
              }
            }));

          if (filesToValidate.length > 1) {
            args = ["-l"];
          }
        }
        return helpers.tempFiles(
            filesToValidate,
            files => helpers.exec(command, args.concat(files), {
              stream: "stdout",
              ignoreExitCode: true
            }))
          .then(output => parseGlslValidatorResponse(filesToValidate, output))
          .catch(console.log);
      }
    };
  }
};
