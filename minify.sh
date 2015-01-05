#!/bin/bash

# npm install -g less
# aptitude install closure-compiler

if [[ -n "$(git status --porcelain)" ]]; then
    echo 'Please commit your changes'
    exit 0
fi

mkdir min

commithash="$(git rev-parse HEAD | cut -b 1-7)"
comment="/* https://github.com/hovel/imagelightbox/tree/$commithash */"

out="min/imagelightbox.min.js"
echo '/* By Osvaldas Valutis, www.osvaldas.info. Available for use under the MIT License */' >> "$out"
echo "$comment" >> "$out"
java -jar /usr/share/java/closure-compiler.jar \
     --compilation_level SIMPLE_OPTIMIZATIONS --js imagelightbox.js >> "$out"

out="min/imagelightbox-extended.min.js"
echo "$comment" >> "$out"
java -jar /usr/share/java/closure-compiler.jar \
     --compilation_level SIMPLE_OPTIMIZATIONS --js imagelightbox-extended.js >> "$out"

out="min/imagelightbox-extended.min.css"
echo "$comment" >> "$out"
lessc -x imagelightbox-extended.css >> "$out"

echo 'Done'
