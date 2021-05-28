echo "Installing retype"

dotnet tool install --global retypeapp

echo -n "Changing directory..."

cd docs/

echo -n "Building documentation: "

retype build --override "{ \"output\": \"./public_html\" }"

echo -n "Injecting script: "

cat ./js/injection.js >> ./public_html/resources/js/config.js