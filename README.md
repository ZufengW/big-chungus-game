# Big Chungus - The Game

A video game about a meme. Play as Big Chungus and fend off waves of enemies.

Play it online in your browser: http://zufengw.github.io/big-chungus-game (Also designed to work for touchscreens.)

Uses [Webpack](https://webpack.js.org/), [PixiJS](https://github.com/pixijs/pixi.js), [TypeScript](https://github.com/Microsoft/TypeScript), [yarn](https://yarnpkg.com/), [TSLint](https://github.com/palantir/tslint) and other supporting packages.


## Set up
What you need: [Node.js and npm](https://nodejs.org/en/download/), yarn.

`git clone git@github.com:ZufengW/big-chungus-game.git` and `cd` into repo.

`yarn install` to install dependencies.

For the game to work you also need the **art assets** (e.g. sprites and fonts), which I haven't yet added to version control. (They're currently git-ignored.) Sorry about that. This might change in the future. But for now you can find those assets in the `gh-pages` branch.


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


## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

(But avoid using the Elmer and Taz sprites)
