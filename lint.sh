#!/bin/bash
#
# pwd
echo linting packages
numberOfErrors=0
for i in */
do
    if [ "$i" != "deploy/" ] && [ "$i" != "node_modules/" ];
    then
        cd "./$i"
        echo "linting $i"
        npm run lint
        numberOfErrors=$((numberOfErrors+$?))
        cd ..
    fi
done
if (( $numberOfErrors > 0 ))
then
  echo $numberOfErrors services have linting errors
  exit 1
fi
