#!/usr/bin/env node
const detective = require("./index");
const ora = require("ora");
const chalk = require("chalk");
const path = require("path");

const spinner = ora();

const filename = process.argv[2];

if (!filename) {
  spinner.fail(
    `${chalk.red("You must provide a file to search dependencies for:")}`
  );
  spinner.info(`e.g: ${chalk.gray("npx detective-angular app.component.ts")}`);
  console.log(process.argv);
  return;
}

async function main() {
  try {
    // Find all angular components below directory (component.html)
    // Find associated ts component file (by convention)
    // Find selector for component
    // Build up depedency-tree of all html files that reference that selector

    const rootDir = path.dirname(filename);

    spinner.start(`Finding dependencies for module ${rootDir}\n`);

    const modules = await detective.glob(rootDir + "/**/*.module.ts", {});

    modules.forEach((module) => {
      detective.showModuleTree(module);
    });

    spinner.succeed("Done!");
  } catch (e) {
    console.error(e);
    spinner.fail(e.message);
  }
}

main();
