#!/bin/bash
set -e
set -u

npm run tsc
rimraf bundle
mv node_modules _node_modules
npm i --production
mkdir bundle
mv node_modules bundle/node_modules
mv _node_modules node_modules
cd bundle
cp ../LICENSE .
cp ../README.md .
cp ../package.json .
cp ../.gitattributes .
cp -r ../lib .
git init
git add .
VERSION=`node -e "process.stdout.write(require('./package.json').version)"`
git commit -m "$VERSION"
git tag "$VERSION"
git remote add origin git@github.com:pnpm/dist.git
git push -u origin master --tags
