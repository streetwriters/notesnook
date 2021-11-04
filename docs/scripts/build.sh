echo "Installing retype"

dotnet tool install --global retypeapp -- version 1.8.0

echo -n "Changing directory..."

cd docs/__generator__

yarn

yarn generate