#!/usr/bin/env node
const detective = require("./index");
const ora = require("ora");

const filename = process.argv[3] || ".";

const spinner = ora(`Finding dependencies of ${filename}`).start();

setTimeout(() => {
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
  spinner.succeed("Doneski");
}, 1000);
