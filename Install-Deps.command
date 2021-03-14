#!/bin/sh

echo Installing dependencies...

cd modules
for x in $(ls); do
  cd $x
  npm install
  cd ..
done
npm init
