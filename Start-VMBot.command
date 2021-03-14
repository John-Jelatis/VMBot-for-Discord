#!/bin/sh

echo Starting VMBot.

cd $(dirname "$0")

while true; do 
  node vmbot;
done

echo Your system is BROKEY BROKEN if you got here without doing some strange trickery.
echo Sorry to be the one to inform you.

sleep 3
