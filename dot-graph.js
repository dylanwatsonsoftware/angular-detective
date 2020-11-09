import * as fs from "fs";
const defaultConfig = {
  baseDir: null,
  excludeRegExp: false,
  fileExtensions: ["js"],
  includeNpm: false,
  requireConfig: null,
  webpackConfig: null,
  tsConfig: null,
  rankdir: "LR",
  layout: "dot",
  fontName: "Arial",
  fontSize: "14px",
  backgroundColor: "#111111",
  nodeColor: "#c6c5fe",
  nodeShape: "box",
  nodeStyle: "rounded",
  noDependencyColor: "#cfffac",
  cyclicNodeColor: "#ff6c60",
  edgeColor: "#757575",
  graphVizOptions: false,
  graphVizPath: false,
  dependencyFilter: false,
};

export function generateDotGraph(components) {
  const config = defaultConfig;
  console.log(JSON.stringify(components, undefined, 2));
  console.log(" ======= DOT FILE ======= ");
  const dotFile = `
  digraph G {
    overlap=false
    pad=0.3
    rankdir=${config.rankdir}
    layout=${config.layout}
    bgcolor="${config.backgroundColor}"
    edge [color="${config.edgeColor}"]
    node [color="${config.nodeColor}", shape=${config.nodeShape}, style=${
    config.nodeStyle
  }, height=0, fontcolor="${config.nodeColor}"]

    ${components
      .filter((component) => component.children.length)
      .map((component) => {
        return component.children
          .map((child) => `"${component.name}" -> "${child}";`)
          .join("\n");
      })
      .join("\n")}
}`;
  console.log(dotFile);
  return dotFile;
}

export function saveToDotFile(filename, components) {
  fs.writeFileSync(filename, generateDotGraph(components));
}
