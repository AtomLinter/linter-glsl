"use babel";

fs = require('fs')
fse = require('fs-extra')
path = require('path')
temp = require('temp')

export default {
  config: {
    glslangValidatorPath: {
      type: "string",
      default: "/usr/local/bin/glslangValidator"
    }
  },

  activate: () => {
    require("atom-package-deps").install("linter-glsl");
  },

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
        const command = atom.config.get("linter-glsl.glslangValidatorPath");
        const args = [];

        args.push(file);
        return helpers.exec(command, args, {
          stream: "stdout"
        }).then(output =>
          helpers.parse(output, regex).map(x => {
            x.filePath = file;
            x.text = x.text.trim();
            return x;
          })
        );
      }
    };
  },

  makeTempDir: () => {
    return new Promise((resolve, reject) =>
      temp.mkdir('AtomLinter', (error, directory) => {
        if (error) return reject(Error(error))
        return resolve(directory)
      }));
  },

  removeTempDir: (tempDir) => {
    return new Promise((resolve, reject) =>
      fse.remove(tempDir, (error) => {
        if (error) return reject(Error(error))
        return resolve()
      }));
  },

  writeTempFile: (tempDir, fileName, fileContent) => {
    new Promise((resolve, reject) => {
      tempFile = path.join(tempDir, fileName)
      return fse.writeFile(tempFile, fileContent, (error) => {
        if (error) return reject(Error(error))
        return resolve(tempFile)
      })
    });
  }
};
