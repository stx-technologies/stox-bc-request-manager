#!/bin/bash
#
# pwd

echo linting packages

for i in */
do
    if [ "$i" != "node_modules/" ]
    then
        cd "./$i"
        echo "linting $i"
        npm run lint
        cd ..
    fi
done