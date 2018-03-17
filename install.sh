#!/bin/bash
#
# pwd

echo installing packages
npm install rimraf concurrently -g

for i in */
do
    if [[ "$i" != "node_modules/" ]]
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" = "clean" ]
        then
            rimraf node_modules/
        fi
        npm install
        cd ..
    fi
done
