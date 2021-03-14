@echo off
title VMBot
cd /D "%~dp0"

:strt
node vmbot
echo OH NO! ITS GONE!
echo Restarting VMBot...
goto :strt

echo How the hell did you get out of the loop without exiting?
ping localhost -n 5 > nul
