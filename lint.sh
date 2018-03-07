#!/bin/bash
#
# pwd

echo linting packages

for i in */
do
    cd "./$i"
    echo "linting $i"
    npm run lint
    cd ..
done