#!/usr/bin/env node
import * as detective from "./index.js";
import ora from "ora";
import chalk from "chalk";
const { red, gray } = chalk;
import * as path from "path";
import { saveToDotFile } from "./dot-graph.js";

const spinner = ora();

async function main() {
  try {
    const filename = process.argv[2];

    if (!filename) {
      spinner.fail(
        `${red("You must provide a file to search dependencies for:")}`
      );
      spinner.info(`e.g: ${gray("npx detective-angular app.component.ts")}`);
      console.log(process.argv);
      return;
    }

    // Find all angular components below directory (component.html)
    // Find associated ts component file (by convention)
    // Find selector for component
    // Build up depedency-tree of all html files that reference that selector
    // Generate dot file based on dep tree

    const rootDir = path.dirname(filename);

    spinner.start(`Finding dependencies for module ${rootDir}`);

    const modules = await detective.glob(rootDir + "/**/*.module.ts", {});

    // modules.forEach((module) => {
    //   detective.showModuleTree(module);
    // });

    spinner.start(`Generating types for ${rootDir}`);

    // const tsFileDoco = await generateSummary([process.argv[2]], {
    //   target: ScriptTarget.ES5,
    //   module: ModuleKind.CommonJS,
    // });

    // console.log();
    // console.log(JSON.stringify(tsFileDoco, undefined, 4));

    saveToDotFile(path.basename(filename) + ".dot",
      modules.map((module) => detective.getFlatModuleDeps(module)).flat()
    );

    spinner.succeed("Done!");
  } catch (e) {
    console.error(e);
    spinner.fail(e.message);
  }
}

main();
