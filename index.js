"use strict";

import htmlParser from "node-html-parser";
const { parse } = htmlParser;
import Set from "es6-set";
import { standardHtmlElements, angularElements } from "./html-elements.js";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import printTree from "print-tree";
import detectiveTypescript from "detective-typescript";
import glob from "glob";
import { generateSummarySync } from "./ts-file-summary.js";
import ts from "typescript";
const { ScriptTarget, ModuleKind } = ts;

export function getDependenciesFromHtml(src) {
  const root = parse(src);
  const dependencies = [...new Set(flatten(root.childNodes).flat())].filter(
    (el) => !standardHtmlElements.includes(el) && !angularElements.includes(el)
  );
  return dependencies;
}

function flatten(nodes) {
  const flat = [];

  nodes.forEach((item) => {
    if (item.childNodes && item.childNodes.length) {
      flat.push(...flatten(item.childNodes));
    }
  });

  const filteredNodes = nodes.map((n) => n.rawTagName).filter((_) => _);

  if (filteredNodes.length) {
    flat.push(filteredNodes);
  }

  return flat;
}

function getFilename(filename, parent) {
  if (parent) {
    const selector = getSelector(filename, parent);
    if (selector) {
      return selector;
    }
  }

  const parts = filename.split("/");
  return parts[parts.length - 1];
}

function getSelector(name, parent) {
  const dir = dirname(parent);
  const fullPath = resolve(dir, `${name}.ts`);
  const types = generateSummarySync([fullPath], {
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
  });

  const component = types
    .map((type) => {
      return (
        type.decorators &&
        type.decorators.find((decorator) => decorator.name === "Component")
      );
    })
    .filter((_) => _)[0];

  if (!component || !component.param || !component.param.selector) return;
  return component.param.selector.replace("'", "");
}

function buildTree(filename, deps, getChild = (name) => ({ name })) {
  return {
    name: getFilename(filename),
    children: deps.map(getChild),
  };
}

function getDepsFromModule(filename) {
  const src = readFileSync(filename, "utf8");
  const moduleDeps = detectiveTypescript(src);
  return moduleDeps.filter((dep) => dep.startsWith("."));
}

function getDepsForComponent(parent, name) {
  const dir = dirname(parent);
  const fullPath = resolve(dir, `${name}.html`);
  try {
    const componentSrc = readFileSync(fullPath, "utf8");
    const children = getDependenciesFromHtml(componentSrc);
    return {
      name: getFilename(name, parent),
      children: children.map((name) => ({ name })),
    };
  } catch (e) {
    console.warn(e.message);
    // Couldn't load the html, so assume no children
    return {
      name: getFilename(name, parent),
      children: [],
    };
  }
}

const _glob = function globp(pattern, options) {
  return new Promise((res, rej) =>
    glob(pattern, options, (error, files) => {
      if (error) return rej(error);
      res(files);
    })
  );
};
export { _glob as glob };

export function getModuleTree(moduleFilename) {
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

  return moduleComponentTree;
}

export function getFlatModuleDeps(moduleFilename) {
  const moduleComponentTree = getModuleTree(moduleFilename);

  console.log("✔ " + moduleFilename + " done!");
  return flattenTree(moduleComponentTree);
}

function flattenTree(child) {
  if (child.children && child.children.length) {
    return [
      {
        name: child.name,
        children: child.children.map((c) => c.name),
      },
      ...child.children.map((c) => flattenTree(c)).flat(),
    ];
  }

  return [
    {
      name: child.name,
      children: [],
    },
  ];
}

export function showModuleTree(moduleFilename) {
  return getModuleTree(moduleFilename);
}
