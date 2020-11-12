#!/usr/bin/env node

import { fileURLToPath } from "url";
import * as path from "path";
import { saveToDotFile } from "./dot-graph.js";
import yargs from "yargs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { readFileSync } from "fs";
console.log(readFileSync(path.resolve(__dirname, "./logo.txt")).toString());

const argv = yargs(process.argv.slice(2))
  .usage("Usage: $0 <file> [options]")
  .option("includeModules", {
    alias: "m",
    description: "Optionally groups components by modules",
    default: false,
  })
  .option("prefix", {
    alias: "p",
    description: "The angular app prefix to remove from the components",
  })
  .demandCommand(1).argv;

import * as detective from "./index.js";

const filename = argv._[0];

const rootDir = path.dirname(filename);

async function main() {
  console.log("Finding angular dependencies...");
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

    saveToDotFile(
      file + ".dot",
      moduleDependencies,
      argv.includeModules,
      argv.prefix || ""
    );

    console.log("Completed!");
  } catch (e) {
    console.error(e);
  }
}

main();
