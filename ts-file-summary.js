import ts from "typescript";
const {
  createProgram,
  forEachChild,
  SyntaxKind,
  displayPartsToString,
  NodeFlags,
} = ts;

/**
 * Originally copied from https://stackoverflow.com/a/39331761
 * Author: Kostya Shkryob <https://stackoverflow.com/users/2169630/kostya-shkryob>
 */

const cache = {};
/**
 * Generate documentation for all classes in a set of .ts files, async
 *
 * @param {string[]} fileNames
 * @param {ts.CompilerOptions} options
 * @param {boolean} includeImported Whether to include summaries for the files that the given files import
 */
export function generateSummary(fileNames, options, includeImported = false) {
  return new Promise((res, rej) => {
    try {
      res(generateSummarySync(fileNames, options, includeImported));
    } catch (e) {
      rej(e);
    }
  });
}

/**
 * Generate documention for all classes in a set of .ts files
 *
 * @param {string[]} fileNames
 * @param {ts.CompilerOptions} options
 * @param {boolean} includeImported Whether to include summaries for the files that the given files import
 *
 */
export function generateSummarySync(
  fileNames,
  options,
  includeImported = false
) {
  if (cache[JSON.stringify(fileNames)]) {
    return cache[JSON.stringify(fileNames)];
  }

  // Build a program using the set of root file names in fileNames
  let program = createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let output /*: DocEntry[]*/ = [];

  if (includeImported) {
    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
      // Walk the tree to search for classes
      forEachChild(sourceFile, visit);
    }
  } else {
    for (const fileName of fileNames) {
      forEachChild(program.getSourceFile(fileName), visit);
    }
  }

  return output;

  /** visit nodes finding exported classes
   * @param {ts.Node} node
   */
  function visit(node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (node.kind === SyntaxKind.ClassDeclaration) {
      // This is a top level class, get its symbol

      output.push(serializeClass(node));
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (node.kind === SyntaxKind.ModuleDeclaration) {
      // This is a namespace, visit its children
      forEachChild(node, visit);
    }
  }

  /** Serialize a symbol into a json object
   * @param {ts.Symbol} symbol
   */
  function serializeSymbol(symbol) {
    return {
      name: symbol.getName(),
      documentation: displayPartsToString(symbol.getDocumentationComment()),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
      ),
    };
  }

  /**
   * Serialize a class symbol information
   * @param {ts.Node} node
   */
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

  /**
   * @param {ts.Decorator} decorator
   */
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
    details.param = getDecoratorParam(decorator);

    return details;
  }

  /** Serialize a signature (call or construct)
   * @param {ts.Signature} signature
   */
  function serializeSignature(signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),

      returnType: checker.typeToString(signature.getReturnType()),
      documentation: displayPartsToString(signature.getDocumentationComment()),
    };
  }

  /** True if this is visible outside this file, false otherwise
   * @param {ts.Node} node
   */
  function isNodeExported(node) {
    return (
      (node.flags & NodeFlags.Export) !== 0 ||
      (node.parent && node.parent.kind === SyntaxKind.SourceFile)
    );
  }
}
/**
 *
 * @param {ts.Decorator} decorator
 */
function getDecoratorParam(decorator) {
  try {
    return decorator.expression
      .getChildren()[2]
      .getChildren()[0]
      .getChildren()[1]
      .getChildren()
      .filter((c) => c.getChildren().length)
      .map((p) => ({
        key: p.getChildren()[0].getText(),
        value: tryJsonParse(p.getChildren()[2].getText()),
      }))
      .reduce(function (map, obj) {
        map[obj.key] = obj.value;
        return map;
      }, {});
  } catch (e) {
    console.warn("Couldn't find decorator for: " + decorator.getText());
  }
}

function tryJsonParse(thing) {
  try {
    return JSON.parse(thing).replace(/'/g, "");
  } catch (e) {
    return thing;
  }
}
