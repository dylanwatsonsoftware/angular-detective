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

export function generateDotGraph(dependencies) {
  const components = dependencies.filter((d) => !d.name.includes("module"));
  const modules = dependencies.filter((d) => d.name.includes("module"));

  const config = defaultConfig;
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

    ${modules.map((module) => {
      return `subgraph "${module.name}" {
        label="${module.name}";
        ${module.children.join(",")};
    }`;
    })}

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
