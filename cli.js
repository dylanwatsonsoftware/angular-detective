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
  spinner.info(`Finding dependencies of ${filename}`).start();
  const src = fs.readFileSync(filename, "utf8");
  const moduleDeps = detectiveTypescript(src);
  return moduleDeps.filter((dep) => dep.startsWith("."));
}

function getDepsForComponent(parent, name) {
  const dir = path.dirname(parent);
  const fullPath = path.resolve(dir, `${name}.html`);
  spinner.start(`Finding dependencies of component ${getFilename(name)}`);
  const componentSrc = fs.readFileSync(fullPath, "utf8");
  const children = detective.getDependenciesFromHtml(componentSrc);
  spinner.succeed(
    `Found ${children.length} dependencies of ${getFilename(name)}`
  );
  return {
    name: getFilename(name),
    children: children.map((name) => ({ name })),
  };
}

function getDepsForModule(parent, name) {
  const dir = path.dirname(parent);
  const fullPath = path.resolve(dir, `${name}.ts`);
  spinner.start(`Finding dependencies of module ${getFilename(name)}`);
  const children = getDepsFromModule(fullPath).filter((a) =>
    a.includes("module")
  );
  spinner.succeed(
    `Found ${children.length} dependencies of ${getFilename(name)}`
  );
  return {
    name: getFilename(name),
    children: children
      /*.filter(child => child.endsWith('.module'))*/
      .map((child) => getDepsForModule(fullPath, child)),
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

async function main() {
  try {
    // Find all angular components below directory (component.html)
    // Find associated ts component file (by convention)
    // Find selector for component
    // Build up depedency-tree of all html files that reference that selector

    const rootDir = path.dirname(filename);

    const modules = (await globp(rootDir + "/**/*.module.ts", {})).map(
      (module) =>
        "./" + path.relative(path.dirname(filename), module).replace(".ts", "")
    );

    const moduleDeps = getDepsFromModule(filename);
    const modulesFromDeps = moduleDeps.filter((dep) => dep.endsWith(".module"));

    console.log(modules);
    console.log(modulesFromDeps);

    const allModules = [...new Set([...modulesFromDeps, ...modules])];
    const moduleTree = buildTree(filename, allModules, (name) => {
      return getDepsForModule(filename, name);
    });

    printTree(
      moduleTree,
      (node) => node.name,
      (node) => node.children
    );

    const components = moduleDeps.filter((dep) => dep.endsWith(".component"));
    const moduleComponentTree = buildTree(filename, components, (name) => {
      return getDepsForComponent(filename, name);
    });

    printTree(
      moduleComponentTree,
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
  } catch (e) {
    console.error(e);
    spinner.fail(e.message);
  }
}

main();
