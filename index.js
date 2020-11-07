"use strict";

const HTMLParser = require("node-html-parser");
const Set = require("es6-set");
const { standardHtmlElements, angularElements } = require("./html-elements");
const fs = require("fs");
const path = require("path");
const printTree = require("print-tree");
const detectiveTypescript = require("detective-typescript");
const glob = require("glob");

module.exports.getDependenciesFromHtml = function (src) {
  const root = HTMLParser.parse(src);
  const dependencies = [...new Set(flatten(root.childNodes).flat())].filter(
    (el) => !standardHtmlElements.includes(el) && !angularElements.includes(el)
  );
  return dependencies;
};

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
  const src = fs.readFileSync(filename, "utf8");
  const moduleDeps = detectiveTypescript(src);
  return moduleDeps.filter((dep) => dep.startsWith("."));
}

function getDepsForComponent(parent, name) {
  const dir = path.dirname(parent);
  const fullPath = path.resolve(dir, `${name}.html`);
  const componentSrc = fs.readFileSync(fullPath, "utf8");
  const children = module.exports.getDependenciesFromHtml(componentSrc);
  return {
    name: getFilename(name),
    children: children.map((name) => ({ name })),
  };
}

module.exports.glob = function globp(pattern, options) {
  return new Promise((res, rej) =>
    glob(pattern, options, (error, files) => {
      if (error) return rej(error);
      res(files);
    })
  );
};

module.exports.showModuleTree = function showModuleTree(moduleFilename) {
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
};
