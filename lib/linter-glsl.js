"use babel";

const glslRegex = /^(.*(?:\.|_))([vfg])((s?\.glsl))$/
const shRegex = /^(.*\.)([vfg])((s(?:h(?:ader)?)?))$/
const defaultRegex = /^(.*\.)(vert|frag|geom)$/

const compileRegex = "^(?<type>[\\w \\-]+): (?<col>\\d+):(?<line>\\d+): (?<message>.*)$";
const linkRegex = "^(?<type>[\\w \\-]+): Linking {{typeName}} stage: (?<message>.*)$";

var makeTempDir = () => new Promise((resolve, reject) =>
  temp.mkdir('AtomLinter', (error, directory) => {
    if (error) {
      reject(Error(error))
    } else {
      resolve(directory);
    }
  }));

var removeTempDir = (tempDir) => new Promise((resolve, reject) =>
  fse.remove(tempDir, (error) => {
    if (error) {
      reject(Error(error))
    } else {
      resolve()
    }
  }));

var writeTempFile = (tempDir, fileName, fileContent) => new Promise((resolve, reject) => {
  var tempFile = path.join(tempDir, fileName)
  return fse.writeFile(tempFile, fileContent, (error) => {
    if (error) {
      reject(Error(error));
    } else {
      resolve(tempFile)
    }
  })
});

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

    console.log(shader.filename)
    console.log(output)
    output.split("\n").forEach(line => {
      if (line.endsWith(shader.filename)) {
        compileStarted = true;
      } else if (compileStarted|| inputs.length == 1) {
        var match = XRegExp(compileRegex).exec(line)
        if (match) {
          toReturn.push({
            type: match.type,
            text: match.message,
            filePath: shader.fullFilename,
            range: [
              [match.line, match.col],
              [undefined, undefined]
            ]
          });
        } else {
          compileStarted = false;
        }
      }

      if (line.trim() == "Linked " + typeName + " stage:") {
        compileStarted = false;
        linkStarted = true;
      } else if (linkStarted) {
        var match = XRegExp(linkRegex.replace("{{typeName}}", typeName)).exec(line)
        if (match) {
          toReturn.push({
            type: match.type,
            text: match.message,
            filePath: shader.fullFilename,
            range: [
              [undefined, undefined],
              [undefined, undefined]
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
    linkTargetPattern = baseFilename + "{{type}}" + baseExtension;
  } else if (extShMatch) {
    baseFilename = extShMatch[1];
    baseShaderType = extShMatch[2];
    baseExtension = extShMatch[3];

    linkTargets = ['v', 'f', 'g'].filter(x => x != baseShaderType)
    linkTargetPattern = baseFilename + "{{type}}" + baseExtension;
  } else if (extDefaultMatch) {
    baseFilename = extDefaultMatch[1];
    baseShaderType = extDefaultMatch[2][0];
    baseExtension = extDefaultMatch[2];

    linkTargets = ["vert", "frag", "geom"].filter(x => x != baseExtension)
    linkTargetPattern = baseFilename + "{{type}}"
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
    outFilename: outFilename
  };
}

export default {
  config: {
    glslangValidatorPath: {
      type: "string",
      default: "glslangValidator"
    },
    linkSimilarShaders: {
      type: "boolean",
      default: true
    }
  },

  activate: () => {
    require("atom-package-deps").install("linter-glsl");

    fs = require('fs');
    fse = require('fs-extra');
    path = require('path');
    temp = require('temp');
    whereis = require("node-whereis");
    XRegExp = require('xregexp');
    XRegExp.install('natives');

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
        this.glslangValidatorPath = undefined;
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
            message: 'Unable to locate glslangValidator at \'' + glslangValidatorPath + '\'',
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
        const command = this.glslangValidatorPath;

        if (command == undefined) {
          return Promise.resolve([]);
        } else {
          const shaderFileTokens = extractShaderFilenameTokens(file);
          var filesToValidate = [{
            filename: shaderFileTokens.outFilename,
            fullFilename: file,
            type: shaderFileTokens.baseShaderType,
            content: content
          }];
          var args = [];

          console.log()

          var results;
          var tempDir;

          return makeTempDir().then(dir => {
            tempDir = dir;

            if (this.linkSimilarShaders) {
              filesToValidate = filesToValidate.concat(shaderFileTokens.linkTargets
                .map(target => shaderFileTokens.linkTargetPattern.replace("{{type}}", target))
                .filter(x => fs.existsSync(shaderFileTokens.dirName + "/" + x))
                .map(x => {
                  return {
                    filename: x,
                    fullFilename: shaderFileTokens.dirName + "/" + x,
                    type: x.substr(-4, 1),
                    content: fs.readFileSync(shaderFileTokens.dirName + "/" + x, "UTF-8")
                  }
                }));
              if (filesToValidate.length > 1) {
                args = ["-l"];
              }
            }
            return Promise.all(filesToValidate.map(validateFile =>
              writeTempFile(tempDir, validateFile.filename, validateFile.content)));
          }).then(files => helpers.exec(command, args.concat(files), {
            stream: "stdout"
          })).then(output =>
            parseGlslValidatorResponse(filesToValidate, output)
          ).then(output => {
            // console.log("here?")
            console.log(JSON.stringify(output))
            results = output;
          }).then(() =>
            removeTempDir(tempDir)
          ).then(() => {
            // console.log("HERE!")
            // console.log(JSON.stringify(results))
            return results
          }).catch((exception) => console.log(exception));
        }
      }
    };
  }
};
