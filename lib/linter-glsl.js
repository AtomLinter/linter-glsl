"use babel";

fs = require('fs')
fse = require('fs-extra')
path = require('path')
temp = require('temp')

export default {
  config: {
    glslangValidatorPath: {
      type: "string",
      default: "glslangValidator"
    }
  },

  activate: () => {
    require("atom-package-deps").install("linter-glsl");
  },

  makeTempDir: () => new Promise((resolve, reject) =>
    temp.mkdir('AtomLinter', (error, directory) => {
      if (error) return reject(Error(error))
      return resolve(directory);
    })),

  removeTempDir: (tempDir) => new Promise((resolve, reject) =>
    fse.remove(tempDir, (error) => {
      if (error) return reject(Error(error))
      return resolve();
    })),

  writeTempFile: (tempDir, fileName, fileContent) => new Promise((resolve, reject) => {
    tempFile = path.join(tempDir, fileName)
    return fse.writeFile(tempFile, fileContent, (error) => {
      if (error) return reject(Error(error));
      return resolve(tempFile);
    })
  }),

  provideLinter: () => {
    const helpers = require("atom-linter");
    const regex = "^(?<type>[\\w \\-]+): (?<col>\\d+):(?<line>\\d+): (?<message>.*)$";

    return {
      name: "glsl",
      grammarScopes: ["source.glsl"],
      scope: "file",
      lintOnFly: true,
      lint: (activeEditor) => {
        const file = activeEditor.getPath();
        const fileName = path.basename(file)
        const glslRegex = /^.*(?:\.|_)([vfg])s?\.glsl$/
        const shRegex = /^.*\.([vfg])s(?:h(?:ader)?)?$/

        var tempFilename = fileName;

        var extGlslMatch = glslRegex.exec(tempFilename)
        var extShMatch = shRegex.exec(tempFilename)

        var shaderType
        if (extGlslMatch) {
          shaderType = extGlslMatch[1]
        } else if (extShMatch) {
          shaderType = extShMatch[1]
        }
        if (extGlslMatch || extShMatch) {
          switch (shaderType) {
            case "v":
              tempFilename += ".vert";
              break;
            case "f":
              tempFilename += ".frag";
              break;
            case "g":
              tempFilename += ".geom";
              break;
          }
        }

        const content = activeEditor.getText();
        const command = atom.config.get("linter-glsl.glslangValidatorPath");
        const args = [];
        var results;

        var tempDir = undefined;
        var tempFile = undefined;

        return module.exports.makeTempDir().then(dir => {
          tempDir = dir;
          return module.exports.writeTempFile(tempDir, tempFilename, content)
        }).then(file => {
          tempFile = file;
          return helpers.exec(command, [tempFile], {
            stream: "stdout"
          });
        }).then(output =>
          results = output
        ).then(() =>
          module.exports.removeTempDir(tempDir)
        ).then(() => helpers.parse(results, regex).map(x => {
          x.filePath = file;
          x.text = x.text.trim();
          return x;
        }));
      }
    };
  }
};
