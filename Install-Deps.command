#!/bin/sh

echo Installing dependencies...

cd vmbot/modules
for x in $(ls); do
  cd $x
  npm install
  cd ..
done
cd ..
npm install
cd ..
