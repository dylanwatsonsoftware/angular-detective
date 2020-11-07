#!/usr/bin/env node
const detective = require("./index");
const ora = require("ora");
const chalk = require("chalk");
const fs = require("fs");
const printTree = require("print-tree");

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

setTimeout(() => {
  spinner.text = "Loading rainbows";
}, 1000);

// Find all angular components below directory (component.html)
// Find associated ts component file (by convention)
// Find selector for component
// Build up depedency-tree of all html files that reference that selector

function printDeps(deps) {
  deps.forEach((dep) => {
    spinner.info(`${chalk.green(dep)}`);
  });
}

function getFilename(filename) {
  const parts = filename.split("/");
  return parts[parts.length - 1];
}

async function main() {
  spinner.start(`Finding dependencies of ${filename}`);
  const src = fs.readFileSync(filename, "utf8");
  const deps = detective.getDependenciesFromHtml(src);
  const depTree = {
    name: getFilename(filename),
    children: deps.map((name) => ({
      name,
    })),
  };

  console.log("\n");
  printTree(
    depTree,
    (node) => node.name,
    (node) => node.children
  );
  spinner.succeed("Done!");
}
main();
