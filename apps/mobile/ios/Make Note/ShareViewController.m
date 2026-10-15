#import <Foundation/Foundation.h>
#import <CoreText/CoreText.h>
#import <ReactNativeShareExtension.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>
#import <React/RCTEventEmitter.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <RCTAppDelegate.h>

/// The containing app bundle (.../Notesnook.app), reached from this extension
/// at .../Notesnook.app/PlugIns/Make Note.appex.
static NSURL *NNContainingAppBundleURL(void)
{
  return [[[NSBundle mainBundle].bundleURL
           URLByDeletingLastPathComponent]   // -> PlugIns
           URLByDeletingLastPathComponent];  // -> Notesnook.app
}

/// Register the Inter family from the containing app's bundle rather than
/// shipping a second copy inside the .appex (~1.6MB). Registered into the
/// process scope, so the fonts resolve by family name exactly as they would
/// via UIAppFonts.
static void NNRegisterSharedFonts(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSURL *appBundleURL = NNContainingAppBundleURL();
    NSArray<NSString *> *fonts = @[ @"Inter-Regular", @"Inter-Italic",
                                    @"Inter-Bold", @"Inter-SemiBold" ];
    for (NSString *font in fonts) {
      NSURL *url = [appBundleURL
                    URLByAppendingPathComponent:
                      [font stringByAppendingPathExtension:@"ttf"]];
      if (![[NSFileManager defaultManager] fileExistsAtPath:url.path]) continue;

      CFErrorRef error = NULL;
      if (!CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url,
                                            kCTFontManagerScopeProcess,
                                            &error)) {
        // Non-fatal: text falls back to the system font.
        RCTLogWarn(@"Could not register %@: %@", font, error);
        if (error) CFRelease(error);
      }
    }
  });
}

@interface ReactNativeShareDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation ReactNativeShareDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // Load the containing app's JS bundle instead of shipping our own copy.
  //
  // The app's main.jsbundle already contains every module this extension needs
  // (index.js registers "NotesnookShare" and requires ./app/share/index), so a
  // second bundle inside the .appex was ~10MB of pure duplication.
  //
  // NSBundle.mainBundle here is .../Notesnook.app/PlugIns/Make Note.appex,
  // so two levels up is the app bundle. This is the same traversal dyld
  // already performs to resolve hermesvm.framework via
  // @executable_path/../../Frameworks.
  NSURL *bundleURL = [NNContainingAppBundleURL()
                      URLByAppendingPathComponent:@"main.jsbundle"];

  if ([[NSFileManager defaultManager] fileExistsAtPath:bundleURL.path]) {
    return bundleURL;
  }

  // Fall back to a local copy if one was shipped (e.g. an older build layout).
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
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

  NNRegisterSharedFonts();

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
