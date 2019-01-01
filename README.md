# Big Chungus - The Game

Play it online: http://zufengw.github.io/big-chungus-game

Uses [Webpack](https://webpack.js.org/), [PixiJS](https://github.com/pixijs/pixi.js), [TypeScript](https://github.com/Microsoft/TypeScript), [yarn](https://yarnpkg.com/), [TSLint](https://github.com/palantir/tslint) and other supporting packages.


## Set up
What you need: [Node.js and npm](https://nodejs.org/en/download/), yarn.

`git clone git@github.com:ZufengW/big-chungus-game.git` and `cd` into repo.

`yarn install` to install dependencies.

## Development

`yarn run start` to start dev server.

`yarn run lint` to run linter. Do this and fix errors before you commit.

See all scripts and add more in `package.json`.

Put your things inside `src`.


## Deploy to production

`yarn run build` to create an output in the `public` directory.

`yarn run deploy` to run deploy script.

The deploy script `deploy.sh` is from https://github.com/X1011/git-directory-deploy.
It's set to deploy the contents of `public` directory to target branch `gh-pages` on the `origin` remote repo.
Suitable for GitHub pages.
