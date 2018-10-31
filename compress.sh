#!/bin/sh

mkdir -p ./validated/out

if [[ $# -eq 0 ]] ; then
  echo "Missing API Key"
  exit 1
fi

# Abort on API Key error
set -e

for file in ./validated/*.png; do
  downloadLink=`curl --user api:$1 --data-binary @$file -s https://api.tinify.com/shrink | python -c "import sys, json; print json.load(sys.stdin)['output']['url']; sys.exit(0)"`
  echo "Downloading $file ($downloadLink)"
  saveTo="./validated/out/$(basename $file)"
  curl $downloadLink -so $saveTo
  echo "Download Completed"
  rm $file
done
