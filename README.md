## Usage

Refer `index.js`

## Notes after scraping

1. 0 - 9 number emojis, (2a-fe0f-20e3), (23-fe0f-20e3) have to remove "fe0f"
2. (1f441-fe0f-200d-1f5e8-fe0f) have to remove all "fe0f"

## Compression

```
mkdir -p out; for i in *.png; do u=`curl --user api:KEY_HERE --data-binary @$i -s https://api.tinify.com/shrink | python -c "import sys, json; print json.load(sys.stdin)['output']['url']; sys.exit(0)"` | curl -o out/$i $u && rm $i; done
```
