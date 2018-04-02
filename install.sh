#!/bin/bash
#
# pwd

echo installing packages
npm install rimraf -g
numberOfErrors=0
for i in */
do
    if [ "$i" != "deploy/" ] && [ "$i" != "node_modules/" ];
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" = "clean" ]
        then
            rimraf node_modules/
            rimraf package-lock.json
        fi
        npm install
        res=$?
        numberOfErrors=$((numberOfErrors+$res))
        if [[ $res == 1 ]]
          then
          echo Failed to install $i
        fi
        cd ..
    fi
done
echo
if (( $numberOfErrors > 0 ))
then
  echo $numberOfErrors services installed incorrectly
  exit 1
fi
