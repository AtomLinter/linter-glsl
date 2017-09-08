module.exports = {
  rules: {
    'prefer-destructuring': [
      'error', {
        VariableDeclarator: {
          array: true,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: true,
        },
      },
      {
        enforceForRenamedProperties: false,
      }
    ],
  }
}
