#!/usr/bin/env node

import * as path from "path";
import { saveToDotFile } from "./dot-graph.js";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .usage("Usage: $0 <file> [options]")
  .option("includeModules", {
    description: "Optionally groups components by modules",
  })
  .default("includeModules", false)
  .alias("m", "includeModules")
  .demandCommand(1).argv;

import * as detective from "./index.js";

const filename = argv._[0];

const rootDir = path.dirname(filename);

async function main() {
  console.log("Finding dependencies...");
  try {
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

    saveToDotFile(file + ".dot", moduleDependencies, argv.includeModules);

    console.log("Completed!");
  } catch (e) {
    console.error(e);
  }
}

main();
