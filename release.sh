#!/usr/bin/env bash

echo 'build'
echo 'tsc'
tsc
echo 'webpack'
webpack
webpack -p -d --config webpack.production.config.js
echo 'typedoc'
typedoc --out doc **/*.ts
echo 'commit'
git add .
git commit -m '$1'
npm version patch
echo 'publish'
git push origin master
git subtree push --prefix doc origin gh-pages
npm publish
