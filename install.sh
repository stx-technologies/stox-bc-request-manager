#!/bin/bash
#
# pwd

echo installing packages
npm install rimraf -g
npm install concurrently -g

for i in */
do
    if [[ "$i" != "node_modules/" ]]
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" = "clean" ]
        then
            rimraf node_modules/
#            rimraf package-lock.json
        fi
        npm install
        cd ..
    fi
done
