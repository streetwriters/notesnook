mkdir tmp
cd tmp
npm init -y
npm install --save "$1"
rsync -av --exclude "node_modules" --delete "../node_modules/$1/" "./node_modules/$1/"
npx patch-package "$1"
mkdir -p ../patches
mv ./patches/* ../patches/
cd ..
rm -rf tmp