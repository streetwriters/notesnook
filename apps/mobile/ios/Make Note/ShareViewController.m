#import <Foundation/Foundation.h>
#import <ReactNativeShareExtension.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>
#import <React/RCTEventEmitter.h>

@interface ShareViewController : ReactNativeShareExtension
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
  NSURL *jsCodeLocation;
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"NotesnookShare"
                                               initialProperties:nil
                                                    launchOptions:nil];
  rootViewTag = rootView.tag;
  rootView.window.backgroundColor =[UIColor clearColor];
  rootView.layer.shadowOpacity = 0;
  rootView.backgroundColor = [UIColor clearColor];

  // Uncomment for console output in Xcode console for release mode on device:
  // RCTSetLogThreshold(RCTLogLevelInfo - 1);

  return rootView;
}


@end
