echo GITHUB_RELEASE=true >> $(PWD)/native/android/gradle.properties
echo GITHUB_RELEASE=true > $(PWD)/native/.env
sed s/false/true/g < react-native.config.js > react-native.config.jss && mv react-native.config.jss react-native.config.js
rm $(PWD)/native/android/app/src/main/java/com/streetwriters/notesnook/SplitModuleLoader.java || true
rm $(PWD)/native/android/app/src/main/java/com/streetwriters/notesnook/SplitModulePackage.java || true
cd native/android
./gradlew assembleRelease --no-daemon
