#!/usr/bin/env node
const detective = require("./index");
const ora = require("ora");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const printTree = require("print-tree");
const detectiveTypescript = require("detective-typescript");
const glob = require("glob");

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

function getDepsFromModule(filename) {
  spinner.start(`Finding dependencies of module ${getFilename(filename)}\n`);
  const src = fs.readFileSync(filename, "utf8");
  const moduleDeps = detectiveTypescript(src);
  return moduleDeps.filter((dep) => dep.startsWith("."));
}

function getDepsForComponent(parent, name) {
  const dir = path.dirname(parent);
  const fullPath = path.resolve(dir, `${name}.html`);
  spinner.start(`Finding dependencies of component ${getFilename(name)}\n`);
  const componentSrc = fs.readFileSync(fullPath, "utf8");
  const children = detective.getDependenciesFromHtml(componentSrc);
//   spinner.succeed(
//     `Found ${children.length} dependencies of ${getFilename(name)}`
//   );
  return {
    name: getFilename(name),
    children: children.map((name) => ({ name })),
  };
}

function globp(pattern, options) {
  return new Promise((res, rej) =>
    glob(pattern, options, (error, files) => {
      if (error) return rej(error);
      res(files);
    })
  );
}

function showModuleTree(moduleFilename) {
  const moduleDeps = getDepsFromModule(moduleFilename);
  const components = moduleDeps.filter((dep) => dep.endsWith(".component"));
  const moduleComponentTree = buildTree(moduleFilename, components, (name) => {
    return getDepsForComponent(moduleFilename, name);
  });

  printTree(
    moduleComponentTree,
    (node) => node.name,
    (node) => node.children
  );
}

async function main() {
  try {
    // Find all angular components below directory (component.html)
    // Find associated ts component file (by convention)
    // Find selector for component
    // Build up depedency-tree of all html files that reference that selector

    const rootDir = path.dirname(filename);

    const modules = (await globp(rootDir + "/**/*.module.ts", {}));

    // const moduleTree = buildTree(filename, modules, (name) => {
    //   return getDepsForModule(filename, name);
    // });

    // printTree(
    //   moduleTree,
    //   (node) => node.name,
    //   (node) => node.children
    // );

    modules.forEach((module) => {
      showModuleTree(module);
    });

    //   const deps = detective.getDependenciesFromHtml(src);
    //   const depTree = buildTree(filename, deps);

    spinner.succeed("Done!");

    //   printTree(
    //     depTree,
    //     (node) => node.name,
    //     (node) => node.children
    //   );
  } catch (e) {
    console.error(e);
    spinner.fail(e.message);
  }
}

main();
