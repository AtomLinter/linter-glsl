"use babel";

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
      lintOnFly: false,
      lint: (activeEditor) => {
        const file = activeEditor.getPath();
        const command = atom.config.get("linter-glsl.glslangValidatorPath");
        const args = [];

        args.push(file);
        return helpers.exec(command, args, {stream: "stdout"}).then(output =>
          helpers.parse(output, regex).map(x => {
              x.filePath = file;
              x.text = x.text.trim();
              return x;
          })
        );
      }
    };
  }
};
