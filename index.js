"use strict";

const HTMLParser = require("node-html-parser");
const Set = require("es6-set");
const { standardHtmlElements, angularElements } = require("./html-elements");

module.exports.getDependenciesFromHtml = function (src) {
  //   const fs = require("fs");
  //   const html = fs.readFileSync(filename, "utf8");

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
