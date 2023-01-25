adb reverse tcp:8081 tcp:8081 || true
rm -rf $(PWD)/native/android/app/build/outputs/bundle || true
cd native/android && ./gradlew bundleDebug
cd ../../
java -jar $HOME/bundletool/bundletool-all-1.13.2.jar build-apks --overwrite --local-testing --bundle $(PWD)/native/android/app/build/outputs/bundle/debug/app-debug.aab --output $(PWD)/native/android/app/build/outputs/bundle/debug/apkset.apks
java -jar $HOME/bundletool/bundletool-all-1.13.2.jar install-apks --apks $(PWD)/native/android/app/build/outputs/bundle/debug/apkset.apks
adb shell monkey -p com.streetwriters.notesnook 1