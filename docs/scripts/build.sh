echo "Installing retype"

dotnet tool install --global retypeapp

echo -n "Changing directory..."

cd docs/__generator__

yarn

yarn generate