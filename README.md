## Usage

Refer `index.js`

## Notes after scraping for twemoji

1. 0 - 9 number emojis ([30-39]-fe0f-20e3), 2a-fe0f-20e3, 23-fe0f-20e3: remove all "fe0f"
2. <del>1f441-fe0f-200d-1f5e8-fe0f: remove all "fe0f"</del> (seems fixed in ios 12.1)

## Compression

```
mkdir -p out; for i in *.png; do u=`curl --user api:KEY_HERE --data-binary @$i -s https://api.tinify.com/shrink | python -c "import sys, json; print json.load(sys.stdin)['output']['url']; sys.exit(0)"` | curl -o out/$i $u && rm $i; done
```
