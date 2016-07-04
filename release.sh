#!/usr/bin/env bash

# build
tsc
webpack
webpack -p -d --config webpack.production.config.js
typedoc --out doc **/*.ts
# commit
git add .
git commit -m npm-release
npm version patch
# publish
git push origin master
git subtree push --prefix doc origin gh-pages
npm publish
