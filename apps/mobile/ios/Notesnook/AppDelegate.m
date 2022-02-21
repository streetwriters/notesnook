#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNBootSplash.h"
#import <React/RCTLinkingManager.h>
#import <MMKV.h>
@implementation AppDelegate

UINavigationController *navController;
UIViewController *rootViewController;
UIViewController *shareViewController;
RCTBridge *bridge;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  
  shareViewController = [UIViewController new];
  
  NSURL *url = (NSURL *) [launchOptions objectForKey:UIApplicationLaunchOptionsURLKey];
  
  if (url != nil) {
    navController = [[UINavigationController alloc] initWithRootViewController:shareViewController];
  } else {
    rootViewController = [UIViewController new];
    navController = [[UINavigationController alloc] initWithRootViewController:rootViewController];
  }
  
  
  navController.navigationBarHidden = YES;
  
  bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  
  
  if (url != nil) {
    RCTRootView *shareView = [[RCTRootView alloc] initWithBridge:bridge
                                                      moduleName:@"QuickNoteIOS"
                                               initialProperties:nil];
    shareView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
    shareViewController.view = shareView;
    [RNBootSplash initWithStoryboard:@"BootSplash" rootView:shareView];
  } else {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                     moduleName:@"Notesnook"                                      initialProperties:nil];
    
    rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
    rootViewController.view = rootView;
    [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];
  }
  
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  
  
  self.window.rootViewController = navController;
  [self.window makeKeyAndVisible];
  
  
  return YES;
}

- (void)applicationWillTerminate:(UIApplication *)application {
  
  MMKV *kv = [MMKV mmkvWithID:@"default" mode:MMKVMultiProcess];
  [kv removeValueForKey:@"appState"];
}


- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}


- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  
  if ([url.absoluteString isEqual:@"ShareMedia://QuickNoteWidget"]) {
    if (rootViewController != nil) {
      
      RCTRootView *shareView = [[RCTRootView alloc] initWithBridge:bridge
                                                        moduleName:@"QuickNoteIOS"
                                                 initialProperties:nil];
      shareView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
      shareViewController.view = shareView;
      [navController pushViewController:shareViewController animated:false];
    }
    
  }
  
  if ([url.absoluteString isEqual:@"ShareMedia://MainApp"]) {
    if (rootViewController == nil) {
      UIApplication *app = [UIApplication sharedApplication];
      [app performSelector:@selector(suspend)];
      [NSThread sleepForTimeInterval:1.0];
      exit(0);
    } else {
      UIApplication *app = [UIApplication sharedApplication];
      [app performSelector:@selector(suspend)];
      [NSThread sleepForTimeInterval:0.5];
      [navController popToRootViewControllerAnimated:false];
    
    }
    
    
  }
  
  return [RCTLinkingManager application:application openURL:url options:options];
}

@end
