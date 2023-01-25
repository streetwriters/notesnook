tc() { set ${*,,} ; echo ${*^} ; }
adb reverse tcp:8081 tcp:8081 || true
rm -rf $(PWD)/native/android/app/build/outputs/bundle || true
cd native/android && ./gradlew bundle$2
cd ../../
java -jar $HOME/bundletool/bundletool-all-1.13.2.jar build-apks --overwrite --local-testing --bundle $(PWD)/native/android/app/build/outputs/bundle/$1/app-$1.aab --output $(PWD)/native/android/app/build/outputs/bundle/$0/apkset.apks
java -jar $HOME/bundletool/bundletool-all-1.13.2.jar install-apks --apks $(PWD)/native/android/app/build/outputs/bundle/$0/apkset.apks
adb shell monkey -p com.streetwriters.notesnook 1