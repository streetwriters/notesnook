echo enableGecko=true >> $(PWD)/native/android/gradle.properties
echo GITHUB_RELEASE=true >> $(PWD)/native/android/gradle.properties
echo GITHUB_RELEASE=true > $(PWD)/native/.env
echo enableGecko=true >> $(PWD)/native/.env
rm $(PWD)/native/android/app/src/main/java/com/streetwriters/notesnook/SplitModuleLoader.java || true
rm $(PWD)/native/android/app/src/main/java/com/streetwriters/notesnook/SplitModulePackage.java || true
cd native/android
./gradlew assembleRelease --no-daemon