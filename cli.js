#!/usr/bin/env node
import * as detective from "./index.js";

import chalk from "chalk";
const { red, gray } = chalk;
import * as path from "path";
import { saveToDotFile } from "./dot-graph.js";
import ora from "ora";

const spinner = ora(`Finding dependencies for module`).start();

const filename = process.argv[2];
const rootDir = path.dirname(filename);

async function main() {
  try {
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

    const modules = await detective.glob(rootDir + "/**/*.module.ts", {});

    const moduleDependencies = modules
      .map((module) => detective.getFlatModuleDeps(module))
      .flat();

    const file = path.basename(filename);

    saveToDotFile(file + ".dot", moduleDependencies);

    
  } catch (e) {
    console.error(e);
  }
}

main();
