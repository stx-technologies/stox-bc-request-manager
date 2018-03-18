#!/bin/bash
#
# pwd

echo update stox-common for all servicess

for i in */
do
    if [ "$i" != "common/" ]
    then
        cd "./$i"
        echo "updating $i"
        npm update stox-common
        cd ..
    fi
done