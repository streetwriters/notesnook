yarn build:beta

rsync -aPzz --exclude "*.map" --exclude "*.txt" ./build/* thecodrr@94.237.75.100:/home/thecodrr/beta.notesnook.com/public_html $1