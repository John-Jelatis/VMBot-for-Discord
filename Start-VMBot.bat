@echo off
title VMBot
cd /D "%~dp0"

:strt
node vmbot
echo OH NO! ITS GONE!
echo Restarting VMBot...
goto :strt
