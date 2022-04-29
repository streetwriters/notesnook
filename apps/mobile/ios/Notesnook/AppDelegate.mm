#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <RNBootSplash/RNBootSplash.h>
#import <React/RCTAppSetupUtils.h>
#import <React/RCTLinkingManager.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/config/ReactNativeConfig.h>

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
  RCTTurboModuleManager *_turboModuleManager;
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#endif

@implementation AppDelegate

UINavigationController *navController;
UIViewController *rootViewController;
UIViewController *shareViewController;
RCTBridge *bridge;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTAppSetupPrepareApp(application);
  shareViewController = [UIViewController new];
  bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  
#if RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif
  
  NSURL *url = (NSURL *) [launchOptions objectForKey:UIApplicationLaunchOptionsURLKey];
  if (url != nil) {
    navController = [[UINavigationController alloc] initWithRootViewController:shareViewController];
  } else {
    rootViewController = [UIViewController new];
    navController = [[UINavigationController alloc] initWithRootViewController:rootViewController];
  }
  
  
  navController.navigationBarHidden = YES;
  
  if (url != nil) {
    RCTRootView *shareView = [[RCTRootView alloc] initWithBridge:bridge
                                                      moduleName:@"QuickNoteIOS"
                                               initialProperties:nil];
    if (@available(iOS 13.0, *)) {
      shareView.backgroundColor = [UIColor systemBackgroundColor];
    } else {
      shareView.backgroundColor = [UIColor whiteColor];
    }
    shareViewController.view = shareView;
    [RNBootSplash initWithStoryboard:@"BootSplash" rootView:shareView];
  } else {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                     moduleName:@"Notesnook"                                      initialProperties:nil];
    if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
    } else {
      rootView.backgroundColor = [UIColor whiteColor];
    }
    rootViewController.view = rootView;
    [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];
  }
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
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

#if RCT_NEW_ARCH_ENABLED

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
initParams:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif

@end
