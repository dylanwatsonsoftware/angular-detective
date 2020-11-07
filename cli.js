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

function getFilename(filename) {
  const parts = filename.split("/");
  return parts[parts.length - 1];
}

function buildTree(filename, deps, getChild = (name) => ({ name })) {
  return {
    name: getFilename(filename),
    children: deps.map(getChild),
  };
}

async function main() {
  spinner.start().info(`Finding dependencies of ${filename}`);
  const src = fs.readFileSync(filename, "utf8");

  // Find all angular components below directory (component.html)
  // Find associated ts component file (by convention)
  // Find selector for component
  // Build up depedency-tree of all html files that reference that selector

  const moduleDeps = detective(src);
  const moduleTree = buildTree(filename, moduleDeps);
  printTree(
    moduleTree,
    (node) => node.name,
    (node) => node.children
  );

  //   const deps = detective.getDependenciesFromHtml(src);
  //   const depTree = buildTree(filename, deps);

  spinner.succeed("Done!");

  //   printTree(
  //     depTree,
  //     (node) => node.name,
  //     (node) => node.children
  //   );
}
main();
