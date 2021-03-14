@echo off
title Installing Dependencies
cd vmbot\modules
for /f %%f in ('dir /b') do (
  cd %%f
  npm install
  cd ..
)
npm install
