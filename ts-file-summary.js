/**
 * Originally copied from https://stackoverflow.com/a/39331761
 * Author: Kostya Shkryob <https://stackoverflow.com/users/2169630/kostya-shkryob>
 */
const ts = require("typescript");

/** Generate documention for all classes in a set of .ts files */
module.exports.generateDocumentation = function generateDocumentation(
  fileNames,
  options
) {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let output /*: DocEntry[]*/ = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    // Walk the tree to search for classes
    ts.forEachChild(sourceFile, visit);
  }

  return output;

  /** visit nodes finding exported classes */
  function visit(node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      // This is a top level class, get its symbol

      output.push(serializeClass(node));
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
      // This is a namespace, visit its children
      ts.forEachChild(node, visit);
    }
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol) {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
      ),
    };
  }

  /** Serialize a class symbol infomration */
  function serializeClass(node) {
    let symbol = checker.getSymbolAtLocation(node.name);

    let details = serializeSymbol(symbol);
    // Get the construct signatures
    details.decorators =
      node.decorators && node.decorators.map(serializeDecorator);
    let constructorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration
    );
    details.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);

    return details;
  }

  function serializeDecorator(decorator) {
    let symbol = checker.getSymbolAtLocation(
      decorator.expression.getFirstToken()
    );
    let decoratorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration
    );
    let details = serializeSymbol(symbol);
    details.constructors = decoratorType
      .getCallSignatures()
      .map(serializeSignature);
    return details;
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(
        signature.getDocumentationComment()
      ),
    };
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node) {
    return (
      (node.flags & ts.NodeFlags.Export) !== 0 ||
      (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
};
