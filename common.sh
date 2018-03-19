#!/bin/bash
#
# pwd

echo update stox-common for all servicess

for i in */
do
   if [ "$i" != "common/" ]
    then
        cd "./$i"

        case "$1" in
            update)     echo "updating $i"
                        npm update stox-common
                ;;
            uninstall)  echo "uninstall $i"
                        npm uninstall stox-common
                ;;
            install)    echo "installing $i"
                        npm install stox-common@git+https://bitbucket.org/stx_site/stox-common.git#dev --save
                ;;
            link)       echo "linking $i"
                        npm link stox-common
                ;;
            unlink)     echo "unlinking $i"
                        npm unlink stox-common
                ;;
        esac

        cd ..
    fi
done
