# linter-glsl

linter-glsl is a package for the Atom editor that lints GLSL shaders on the fly.

It uses the Khronos GLSL Validator which is part of the [GL Shading Language reference compiler](https://www.khronos.org/opengles/sdk/tools/Reference-Compiler/) as well as the [language-glsl](https://atom.io/packages/language-glsl/) and [linter](https://atom.io/packages/linter/) Atom packages.

It also works nicely alongside [autocomplete-glsl](https://atom.io/packages/autocomplete-glsl).

![](https://atomlinter.github.io/linter-glsl/images/linter-glsl-1.0.0.png)

## Requirements

 * [glslangValidator](https://www.khronos.org/opengles/sdk/tools/Reference-Compiler/)
 * [language-glsl](https://atom.io/packages/language-glsl/)
 * [linter](https://atom.io/packages/linter/)

## Installation

1. Install [glslangValidator](https://www.khronos.org/opengles/sdk/tools/Reference-Compiler/)
2. Install [linter](https://atom.io/packages/linter/), [language-glsl](https://atom.io/packages/language-glsl/) and [linter-glsl](https://atom.io/packages/linter-glsl/), either through 'Install Packages And Themes' or with apm:

   ```sh
   $ apm install linter language-glsl linter-glsl
   ```
3. Configure the path to glslangValidator in preferences.
4. Lint!

## Acknowledgements

 * [linter-clang](https://github.com/AtomLinter/linter-clang/) was used as a reference for interacting with the atom-linter package, styling, and how to write specs for Atom.
 * [linter-haml](https://github.com/AtomLinter/linter-haml/) was used as a reference for how to create temporary directories and files so that linting can be performed on the fly.
