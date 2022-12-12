<p align="center">
	<img alt="angular-detective" src="assets/angular-detective.png" width="320">
</p>

### angular-detective


> Find the dependencies of an angular component and output a dot file


### Usage
#### Command Line
```
npx github:dylanwatsonsoftware/angular-detective <path to angular module file>
```

i.e
```
npx github:dylanwatsonsoftware/angular-detective src/app/app.module.ts
```

#### Code
```js
var detective = require('angular-detective');

const modules = await detective.glob(rootDir + "/**/*.module.ts", {});

const moduleDependencies = modules
    .map((module) => detective.getFlatModuleDeps(module))
    .flat();
```

### What it does
- Find all angular components below directory (*.component.html)
    - Find associated ts component file (by convention eg. *.component.ts)
    - Find selector for component (via typescript decorator parsing)
- Build up depedency-tree of all html files that reference that selector
- Output a dot file of the dependencies

### Attribution

Whilst this was intended to work with a similar interface to other detectives, so it can be incorporated into Madge,
that no longer seems to be an easy task as the other detectives have no awareness of the filename of a the give file (they are fed the contents of a js file and just look for imports). 

This is a inspired by the packages by [mrjoelkemp](https://github.com/mrjoelkemp/), given the lack of angular component detective. It is the counterpart to  [detective-typescript](https://github.com/pahen/detective-typescript), [detective](https://github.com/substack/node-detective), [detective-amd](https://github.com/mrjoelkemp/node-detective-amd), [detective-sass](https://github.com/mrjoelkemp/node-detective-sass), [detective-scss](https://github.com/mrjoelkemp/node-detective-scss) and [detective-es6](https://github.com/mrjoelkemp/node-detective-es6).



### License

MIT
