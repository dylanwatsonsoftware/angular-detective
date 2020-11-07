### detective-angular-component
> Find the dependencies of an angular component
Intended to work with a similar interface to other detecives, so it can be incorporated into Madge.

`npm install --save detective-angular-component` // Not deployed yet

This is a inspired by the packages by [mrjoelkemp](https://github.com/mrjoelkemp/), given the lack of angular component detective. It is the counterpart to  [detective-typescript](https://github.com/pahen/detective-typescript), [detective](https://github.com/substack/node-detective), [detective-amd](https://github.com/mrjoelkemp/node-detective-amd), [detective-sass](https://github.com/mrjoelkemp/node-detective-sass), [detective-scss](https://github.com/mrjoelkemp/node-detective-scss) and [detective-es6](https://github.com/mrjoelkemp/node-detective-es6).

### What it does
- Find all angular components below directory (component.html)
    - Find associated ts component file (by convention)
    - Find selector for component
- Build up depedency-tree of all html files that reference that selector

### Usage

```js
var detective = require('detective-angular-component');

var content = fs.readFileSync('app.module.ts', 'utf8');

var dependencies = detective(content);
```

### License

MIT