"use babel"

var os = require("os")

const glslRegex = /^(.*(?:\.|_))([vfg])((s?\.glsl))$/
const shRegex = /^(.*\.)([vfg])((s(?:h(?:ader)?)?))$/
const defaultRegex = /^(.*\.)(vert|frag|geom)$/

const compileRegex = "^([\\w \\-]+): (\\d+):(\\d+): (.*)$";
const linkRegex = "^([\\w \\-]+): Linking {{typeName}} stage: (.*)$";

var shaderTypeLookup = {
  'v': "vertex",
  'f': "fragment",
  'g': "geometry"
};

var parseGlslValidatorResponse = (inputs, output) => new Promise((resolve, reject) => {
  var toReturn = [];

  var currentShader;
  inputs.forEach(shader => {
    var compileStarted = false;
    var linkStarted = false;
    var typeName = shaderTypeLookup[shader.type];

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
        var match = new RegExp(linkRegex.replace("{{typeName}}", typeName)).exec(line)
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
  resolve(toReturn)
});

var extractShaderFilenameTokens = (shaderFilename) => {
  const fileName = path.basename(shaderFilename)
  const dirName = path.dirname(shaderFilename)

  var baseFilename;
  var baseShaderType;
  var baseExtension;

  var linkTargetPattern;
  var linkTargets;

  var extGlslMatch = glslRegex.exec(fileName);
  var extShMatch = shRegex.exec(fileName);
  var extDefaultMatch = defaultRegex.exec(fileName);

  if (extGlslMatch) {
    baseFilename = extGlslMatch[1];
    baseShaderType = extGlslMatch[2];
    baseExtension = extGlslMatch[3];

    linkTargets = ['v', 'f', 'g'].filter(x => x != baseShaderType)
    linkTargetPattern = `${baseFilename}{{type}}${baseExtension}`;
  } else if (extShMatch) {
    baseFilename = extShMatch[1];
    baseShaderType = extShMatch[2];
    baseExtension = extShMatch[3];

    linkTargets = ['v', 'f', 'g'].filter(x => x != baseShaderType)
    linkTargetPattern = `${baseFilename}{{type}}${baseExtension}`;
  } else if (extDefaultMatch) {
    baseFilename = extDefaultMatch[1];
    baseShaderType = extDefaultMatch[2][0];
    baseExtension = extDefaultMatch[2];

    linkTargets = ["vert", "frag", "geom"].filter(x => x != baseExtension)
    linkTargetPattern = `${baseFilename}{{type}}`
  } else {
    throw "Unknown shader type"
  }

  var outFilename = baseFilename;
  if (!outFilename.endsWith(".")) outFilename += ".";

  switch (baseShaderType) {
    case "v":
      outFilename += "vert";
      break;
    case "f":
      outFilename += "frag";
      break;
    case "g":
      outFilename += "geom";
      break;
  }

  return {
    linkTargets: linkTargets,
    linkTargetPattern: linkTargetPattern,
    baseFilename: baseFilename,
    baseShaderType: baseShaderType,
    dirName: dirName,
    outFilename: outFilename,
    fullFilename: shaderFilename
  };
}

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

  activate: () => {
    require("atom-package-deps").install("linter-glsl");

    fs = require('fs');
    path = require('path');
    whereis = require("node-whereis");

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
        } else if (whereis(glslangValidatorPath) != null) {
          this.glslangValidatorPath = whereis(glslangValidatorPath);
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

  deactivate: () => {
    this.subscriptions.dispose();
  },

  provideLinter: () => {
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
            .map(target => shaderFileTokens.linkTargetPattern.replace("{{type}}", target))
            .map(x => `${shaderFileTokens.dirName}${path.sep}${x}`)
            .filter(fs.existsSync)
            .map(extractShaderFilenameTokens)
            .map(x => {
              return {
                'name': x.outFilename,
                'fullFilename': x.fullFilename,
                'type': x.baseShaderType,
                'contents': fs.readFileSync(x.fullFilename, "UTF-8")
              }
            }));
          if (filesToValidate.length > 1) {
            args = ["-l"];
          }
        }
        return helpers.tempFiles(
            filesToValidate,
            files => helpers.exec(command, args.concat(files), {
              stream: "stdout"
            }))
          .then(output => parseGlslValidatorResponse(filesToValidate, output))
          .catch(console.log);
      }
    };
  }
};
