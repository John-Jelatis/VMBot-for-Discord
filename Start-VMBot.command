#!/bin/sh

echo Starting VMBot.

cd $(dirname "$0")

while true; do 
  node vmbot;
done

