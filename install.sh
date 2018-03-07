#!/bin/bash
#
# pwd

echo installing packages
npm i
npm install rimraf -g

common="${PWD##*/}-common"

cd "./common"
echo "installing common/"
if [ "$1" = "clean" ]
then
    rimraf node_modules/
    rimraf package-lock.json
fi
npm install
cd ..

for i in */
do
    if [[ "$i" != "common/" && "$i" != "node_modules/" ]]
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" = "clean" ]
        then
            rimraf node_modules/
            rimraf package-lock.json
        fi
        npm install
        cd ..
    fi
done