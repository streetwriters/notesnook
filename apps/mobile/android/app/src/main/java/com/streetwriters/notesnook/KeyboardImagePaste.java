package com.streetwriters.notesnook;

import android.content.ClipData;
import android.content.ClipDescription;
import android.content.Context;
import android.net.Uri;
import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.util.Predicate;
import androidx.core.view.ContentInfoCompat;
import androidx.core.view.ViewCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.util.WeakHashMap;

/**
 * Samsung Keyboard only offers clipboard images to a field whose
 * {@code EditorInfo.contentMimeTypes} includes an image type, and then delivers
 * the image with {@code commitContent}. Text inputs pick that up from
 * {@code OnReceiveContentListener}. The editor WebView overrides input
 * connection creation, so it advertises the types itself and forwards the
 * clip here.
 */
public final class KeyboardImagePaste {
  public static final String EVENT = "nnKeyboardImage";

  static final String[] MIME_TYPES =
      new String[] {
        "text/plain",
        "text/html",
        "text/*",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "image/*"
      };

  private static WeakReference<ReactContext> reactContext = new WeakReference<>(null);
  private static final WeakHashMap<View, Boolean> WATCHING = new WeakHashMap<>();

  private KeyboardImagePaste() {}

  public static void attach(@Nullable ReactContext context) {
    if (context != null) {
      reactContext = new WeakReference<>(context);
    }
  }

  /** Install the listener on native text fields before they are focused. */
  public static void watch(View root) {
    if (root == null || WATCHING.containsKey(root)) return;
    WATCHING.put(root, Boolean.TRUE);
    root.getViewTreeObserver()
        .addOnGlobalLayoutListener(() -> installOnTextInputs(root));
  }

  public static @Nullable ContentInfoCompat onReceive(View view, ContentInfoCompat payload) {
    Pair<ContentInfoCompat, ContentInfoCompat> split =
        payload.partition(
            (Predicate<ClipData.Item>)
                item -> {
                  if (item.getUri() == null) return false;
                  String mime = mimeFor(view.getContext(), payload.getClip(), item);
                  return mime != null && mime.startsWith("image/");
                });
    if (split.first != null) {
      deliver(view.getContext(), split.first.getClip());
    }
    return split.second;
  }

  private static void installOnTextInputs(View view) {
    if (view instanceof TextView && !(view instanceof WebView)) {
      if (ViewCompat.getOnReceiveContentMimeTypes(view) == null) {
        ViewCompat.setOnReceiveContentListener(view, MIME_TYPES, KeyboardImagePaste::onReceive);
      }
    }
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        installOnTextInputs(group.getChildAt(i));
      }
    }
  }

  private static void deliver(Context context, ClipData clip) {
    ReactContext react = reactContext.get();
    if (react == null || clip == null) return;
    WritableArray images = Arguments.createArray();
    ClipDescription description = clip.getDescription();
    for (int i = 0; i < clip.getItemCount(); i++) {
      ClipData.Item item = clip.getItemAt(i);
      Uri uri = item.getUri();
      if (uri == null) continue;
      String mime = mimeAt(context, description, i, uri);
      if (mime == null || !mime.startsWith("image/")) continue;
      try {
        File copy = copyToCache(context, uri, mime, displayName(context, uri));
        WritableMap image = Arguments.createMap();
        image.putString("path", copy.getAbsolutePath());
        image.putString("mime", mime);
        image.putString("filename", copy.getName());
        images.pushMap(image);
      } catch (Exception ignored) {
        // A clipboard grant can expire. Skip that item and keep the rest.
      }
    }
    if (images.size() == 0) return;
    WritableMap payload = Arguments.createMap();
    payload.putArray("images", images);
    react.emitDeviceEvent(EVENT, payload);
  }

  private static String mimeFor(Context context, ClipData clip, ClipData.Item item) {
    if (item.getUri() == null) return null;
    int index = -1;
    for (int i = 0; i < clip.getItemCount(); i++) {
      if (clip.getItemAt(i) == item) {
        index = i;
        break;
      }
    }
    if (index < 0) return context.getContentResolver().getType(item.getUri());
    return mimeAt(context, clip.getDescription(), index, item.getUri());
  }

  private static String mimeAt(
      Context context, @Nullable ClipDescription description, int index, Uri uri) {
    if (description != null && index < description.getMimeTypeCount()) {
      String mime = description.getMimeType(index);
      if (mime != null && !mime.equals(ClipDescription.MIMETYPE_TEXT_PLAIN)) return mime;
    }
    return context.getContentResolver().getType(uri);
  }

  private static String displayName(Context context, Uri uri) {
    String last = uri.getLastPathSegment();
    if (last == null || last.isEmpty()) return "image";
    return last.replaceAll("[\\\\/]", "_");
  }

  private static File copyToCache(Context context, Uri uri, String mime, String name)
      throws Exception {
    File dir = new File(context.getCacheDir(), "keyboard-images");
    if (!dir.exists() && !dir.mkdirs() && !dir.isDirectory()) {
      throw new IllegalStateException("cache");
    }
    String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
    if (!safe.contains(".")) {
      safe = safe + extensionFor(mime);
    }
    File out = new File(dir, System.currentTimeMillis() + "-" + safe);
    try (InputStream in = context.getContentResolver().openInputStream(uri);
        OutputStream output = new FileOutputStream(out)) {
      if (in == null) throw new IllegalStateException("stream");
      byte[] buffer = new byte[16384];
      int read;
      while ((read = in.read(buffer)) >= 0) {
        output.write(buffer, 0, read);
      }
    }
    return out;
  }

  private static String extensionFor(String mime) {
    if (mime == null) return ".jpg";
    if (mime.contains("png")) return ".png";
    if (mime.contains("gif")) return ".gif";
    if (mime.contains("webp")) return ".webp";
    return ".jpg";
  }
}
