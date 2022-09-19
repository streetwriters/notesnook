diff --git a/node_modules/@react-navigation/native-stack/src/views/NativeStackView.native.tsx b/node_modules/@react-navigation/native-stack/src/views/NativeStackView.native.tsx
index 774aafc..c57d4f7 100644
--- a/node_modules/@react-navigation/native-stack/src/views/NativeStackView.native.tsx
+++ b/node_modules/@react-navigation/native-stack/src/views/NativeStackView.native.tsx
@@ -3,7 +3,6 @@ import {
   getHeaderTitle,
   HeaderHeightContext,
   HeaderShownContext,
-  SafeAreaProviderCompat,
 } from '@react-navigation/elements';
 import {
   NavigationContext,
@@ -75,7 +74,10 @@ const MaybeNestedStack = ({
   const content = (
     <DebugContainer
       style={[
-        styles.container,
+        {
+          width:'100%',
+          height:'100%'
+        },
         presentation !== 'transparentModal' &&
           presentation !== 'containedTransparentModal' && {
             backgroundColor: colors.background,
@@ -90,7 +92,10 @@ const MaybeNestedStack = ({
 
   if (isHeaderInModal) {
     return (
-      <ScreenStack style={styles.container}>
+      <ScreenStack style={{
+        width:"100%",
+        height:'100%'
+      }}>
         <Screen enabled style={StyleSheet.absoluteFill}>
           <HeaderConfig
             {...options}
@@ -164,12 +169,12 @@ const SceneView = ({
     Platform.OS === 'ios' && !(Platform.isPad && Platform.isTVOS);
   const isLandscape = frame.width > frame.height;
 
-  const topInset = isModal || (isIPhone && isLandscape) ? 0 : insets.top;
+  const topInset =  isModal || (isIPhone && isLandscape) ? 0 : insets.top;
 
   const isParentHeaderShown = React.useContext(HeaderShownContext);
   const parentHeaderHeight = React.useContext(HeaderHeightContext);
 
-  const defaultHeaderHeight = getDefaultHeaderHeight(frame, isModal, topInset);
+  const defaultHeaderHeight =  getDefaultHeaderHeight(frame, isModal, topInset);
 
   const [customHeaderHeight, setCustomHeaderHeight] =
     React.useState(defaultHeaderHeight);
@@ -287,7 +292,10 @@ function NativeStackViewInner({ state, navigation, descriptors }: Props) {
   }, [dismissedRouteName]);
 
   return (
-    <ScreenStack style={styles.container}>
+    <ScreenStack style={{
+      width:'100%',
+      height:'100%'
+    }}>
       {state.routes.map((route, index) => {
         const descriptor = descriptors[route.key];
         const previousKey = state.routes[index - 1]?.key;
@@ -340,9 +348,7 @@ function NativeStackViewInner({ state, navigation, descriptors }: Props) {
 
 export default function NativeStackView(props: Props) {
   return (
-    <SafeAreaProviderCompat>
-      <NativeStackViewInner {...props} />
-    </SafeAreaProviderCompat>
+    <NativeStackViewInner {...props} />
   );
 }
 
