echo \nenableGecko=true >> $(PWD)/native/android/gradle.properties
echo \nenableGecko=true >> $(PWD)/native/.env
$(PWD)/scripts/gh-release.sh