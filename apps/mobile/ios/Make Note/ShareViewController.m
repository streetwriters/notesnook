#import <Foundation/Foundation.h>
#import <ReactNativeShareExtension.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>
#import <React/RCTEventEmitter.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <RCTAppDelegate.h>

@interface ReactNativeShareDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation ReactNativeShareDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
}

@end

@interface ShareViewController : ReactNativeShareExtension

@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;
@property (nonatomic, strong) ReactNativeShareDelegate *reactNativeDelegate;

@end

@implementation ShareViewController

@synthesize bridge = _bridge;
@synthesize callableJSModules = _callableJSModules;

+ (BOOL)requiresMainQueueSetup {
  return true;
}

int rootViewTag = 0;

RCT_EXPORT_MODULE();

- (UIView*) shareView {
  
  self.reactNativeDelegate = [[ReactNativeShareDelegate alloc] init];
  RCTReactNativeFactory *factory = [[RCTReactNativeFactory alloc] initWithDelegate:self.reactNativeDelegate];
  self.reactNativeDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  self.reactNativeFactory = factory;
  
  UIView* rootView = [self.reactNativeFactory.rootViewFactory viewWithModuleName:@"NotesnookShare"];
  rootViewTag = (int) rootView.tag;
  rootView.window.backgroundColor =[UIColor clearColor];
  rootView.layer.shadowOpacity = 0;
  rootView.backgroundColor = [UIColor clearColor];
  // Uncomment for console output in Xcode console for release mode on device:
  // RCTSetLogThreshold(RCTLogLevelInfo - 1);

  return rootView;
}




@end
