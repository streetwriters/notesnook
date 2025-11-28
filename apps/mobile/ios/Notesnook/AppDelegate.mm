#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import "RNShortcuts.h"
#import "RNBootSplash.h"
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import "RNFileUploader.h"

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation ReactNativeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

@interface AppDelegate ()
@property (nonatomic, strong) ReactNativeDelegate *reactNativeDelegate;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.dependencyProvider = [RCTAppDependencyProvider new];
  ReactNativeDelegate *delegate = [ReactNativeDelegate new];
  RCTReactNativeFactory *factory = [[RCTReactNativeFactory alloc] initWithDelegate:delegate];
  delegate.dependencyProvider = [RCTAppDependencyProvider new];
  self.reactNativeDelegate = delegate;
  
  self.reactNativeFactory = factory;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [factory startReactNativeWithModuleName: @"Notesnook"
                                      inWindow:self.window
                           launchOptions:launchOptions];

  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
 
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)application:(UIApplication *)application performActionForShortcutItem:(UIApplicationShortcutItem *)shortcutItem completionHandler:(void (^)(BOOL))completionHandler {
  [RNShortcuts performActionForShortcutItem:shortcutItem completionHandler:completionHandler];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (void)customizeRootView:(RCTRootView *)rootView {
  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView]; // ⬅️ initialize the splash screen
}

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)())completionHandler {
  [RNFileUploader setCompletionHandlerWithIdentifier:identifier completionHandler:completionHandler];
}

@end
