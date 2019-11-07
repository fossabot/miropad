#!/bin/bash
############################
# deploy.sh
############################

npm version minor &&
  npm run build &&
  git add ./dist/* &&
  git amend -n &&
  git push &&
  git subtree push --prefix dist origin gh-pages
