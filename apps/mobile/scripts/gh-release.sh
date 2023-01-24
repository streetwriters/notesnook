echo \nGITHUB_RELEASE=true >> $(PWD)/native/android/gradle.properties
echo \nGITHUB_RELEASE=true > $(PWD)/native/.env
cd native/android
./gradlew assembleRelease --no-daemon
