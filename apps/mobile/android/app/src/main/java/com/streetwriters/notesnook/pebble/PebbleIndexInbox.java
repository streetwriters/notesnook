package com.streetwriters.notesnook.pebble;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Copies a capture intent onto app-private storage so the FileProvider grant
 * can expire while Headless JS still has the audio and metadata.
 */
public final class PebbleIndexInbox {
    private static final String TAG = "PebbleIndexInbox";

    private PebbleIndexInbox() {}

    public static boolean hasPending(Context context) {
        File[] files = inboxDir(context).listFiles();
        if (files == null) return false;
        for (File file : files) {
            if (file.getName().endsWith(".json")) return true;
        }
        return false;
    }

    static File inboxDir(Context context) {
        File dir = new File(context.getFilesDir(), PebbleIndexContract.INBOX_DIR);
        if (!dir.exists() && !dir.mkdirs()) {
            Log.w(TAG, "Could not create inbox dir " + dir);
        }
        return dir;
    }

    public static String enqueue(Context context, Intent intent) {
        String id = UUID.randomUUID().toString();
        Uri audioUri = extractAudioUri(intent);
        long claimedSize = extraLong(intent, PebbleIndexContract.EXTRA_AUDIO_SIZE, 0);
        File audioFile = null;
        long audioSize = 0;
        if (audioUri != null) {
            audioFile = new File(inboxDir(context), id + ".m4a");
            audioSize = copyUri(context, audioUri, audioFile);
            if (audioSize <= 0) {
                Log.e(TAG, "Audio copy produced 0 bytes from " + audioUri);
                if (audioFile.exists()) audioFile.delete();
                audioFile = null;
            } else {
                Log.i(TAG, "Copied " + audioSize + " bytes of audio from " + audioUri);
            }
        }
        if (audioFile == null) {
            String b64 = extraString(intent, PebbleIndexContract.EXTRA_AUDIO_BASE64, null);
            if (b64 != null && b64.length() > 0) {
                try {
                    byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                    if (bytes != null && bytes.length > 0) {
                        audioFile = new File(inboxDir(context), id + ".m4a");
                        try (FileOutputStream out = new FileOutputStream(audioFile)) {
                            out.write(bytes);
                        }
                        audioSize = bytes.length;
                        Log.i(TAG, "Wrote " + audioSize + " bytes of audio from base64 extra");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to decode audioBase64 extra", e);
                    if (audioFile != null && audioFile.exists()) audioFile.delete();
                    audioFile = null;
                    audioSize = 0;
                }
            }
        }
        if (audioFile == null && claimedSize > 0) {
            Log.e(TAG, "Pebble claimed " + claimedSize
                    + " audio bytes but no URI/base64 could be copied. extras="
                    + (intent.getExtras() != null ? intent.getExtras().keySet().toString() : "null")
                    + " data=" + intent.getData()
                    + " clip=" + intent.getClipData());
        } else if (audioFile == null) {
            Log.i(TAG, "No audio on capture intent (transcription-only or missing audio)");
        }

        JSONObject json = new JSONObject();
        try {
            json.put("id", id);
            json.put("recordingId", extraString(intent, PebbleIndexContract.EXTRA_RECORDING_ID, id));
            json.put("transcription", extraString(intent, PebbleIndexContract.EXTRA_TRANSCRIPTION, ""));
            json.put("recordedAt", extraLong(intent, PebbleIndexContract.EXTRA_RECORDED_AT, System.currentTimeMillis()));
            json.put("client", extraString(intent, PebbleIndexContract.EXTRA_CLIENT, "ring"));
            json.put("trigger", extraString(intent, PebbleIndexContract.EXTRA_TRIGGER, ""));
            json.put("payloadMode", extraString(intent, PebbleIndexContract.EXTRA_PAYLOAD_MODE, "both"));
            json.put("test", intent.getBooleanExtra(PebbleIndexContract.EXTRA_TEST, false));
            json.put("kind", extraString(intent, PebbleIndexContract.EXTRA_KIND, PebbleIndexContract.KIND_NOTE));
            String title = extraString(intent, PebbleIndexContract.EXTRA_TITLE, "");
            if (title.length() > 0) json.put("title", title);
            boolean hasDeadline = extraBoolean(intent, PebbleIndexContract.EXTRA_HAS_DEADLINE, false);
            json.put("hasDeadline", hasDeadline);
            if (hasDeadline) {
                long epochMs = extraLong(intent, PebbleIndexContract.EXTRA_DEADLINE_EPOCH_MS, 0);
                if (epochMs > 0) json.put("deadlineEpochMs", epochMs);
                String iso = extraString(intent, PebbleIndexContract.EXTRA_DEADLINE_ISO, "");
                if (iso.length() > 0) json.put("deadlineIso", iso);
            }
            long notifyBefore = extraLong(intent, PebbleIndexContract.EXTRA_NOTIFY_BEFORE_SECONDS, -1);
            if (notifyBefore >= 0) json.put("notifyBeforeSeconds", notifyBefore);
            if (claimedSize > 0) json.put("audioSizeClaimed", claimedSize);
            if (audioFile != null) {
                json.put("audioPath", audioFile.getAbsolutePath());
                json.put("audioSize", audioSize);
                json.put("audioMime", "audio/mp4");
                json.put("audioName", extraString(intent, PebbleIndexContract.EXTRA_RECORDING_ID, id) + ".m4a");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to serialize capture", e);
        }

        File meta = new File(inboxDir(context), id + ".json");
        try (FileOutputStream out = new FileOutputStream(meta)) {
            out.write(json.toString().getBytes("UTF-8"));
        } catch (Exception e) {
            Log.e(TAG, "Failed to write inbox metadata", e);
        }
        return id;
    }

    public static JSONArray pendingAsJson(Context context) {
        JSONArray array = new JSONArray();
        File[] files = inboxDir(context).listFiles();
        if (files == null) return array;
        for (File file : files) {
            if (!file.getName().endsWith(".json")) continue;
            try {
                byte[] bytes = readAll(file);
                array.put(new JSONObject(new String(bytes, "UTF-8")));
            } catch (Exception e) {
                Log.w(TAG, "Skipping corrupt inbox item " + file.getName(), e);
            }
        }
        return array;
    }

    public static void remove(Context context, String id) {
        File dir = inboxDir(context);
        new File(dir, id + ".json").delete();
        new File(dir, id + ".m4a").delete();
    }

    static List<String> pendingIds(Context context) {
        List<String> ids = new ArrayList<>();
        File[] files = inboxDir(context).listFiles();
        if (files == null) return ids;
        for (File file : files) {
            String name = file.getName();
            if (name.endsWith(".json")) {
                ids.add(name.substring(0, name.length() - 5));
            }
        }
        return ids;
    }

    private static Uri extractAudioUri(Intent intent) {
        if (intent == null) return null;
        Uri stream = parcelableUri(intent, Intent.EXTRA_STREAM);
        if (stream != null) return stream;
        String extra = extraString(intent, PebbleIndexContract.EXTRA_AUDIO_URI, null);
        if (extra != null && extra.length() > 0) {
            try {
                return Uri.parse(extra);
            } catch (Exception ignored) {
            }
        }
        if (intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
            Uri clipUri = intent.getClipData().getItemAt(0).getUri();
            if (clipUri != null) return clipUri;
        }
        if (intent.getData() != null) return intent.getData();
        return null;
    }

    @SuppressWarnings("deprecation")
    private static Uri parcelableUri(Intent intent, String key) {
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                Uri typed = intent.getParcelableExtra(key, Uri.class);
                if (typed != null) return typed;
            }
            Object raw = intent.getParcelableExtra(key);
            if (raw instanceof Uri) return (Uri) raw;
            if (raw instanceof String) return Uri.parse((String) raw);
        } catch (Exception e) {
            Log.w(TAG, "Could not read parcelable URI extra " + key, e);
        }
        return null;
    }

    private static long copyUri(Context context, Uri uri, File dest) {
        try (InputStream in = context.getContentResolver().openInputStream(uri);
             FileOutputStream out = new FileOutputStream(dest)) {
            if (in == null) {
                Log.e(TAG, "ContentResolver.openInputStream returned null for " + uri);
                return 0;
            }
            byte[] buf = new byte[16 * 1024];
            long total = 0;
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
                total += n;
            }
            return total;
        } catch (Exception e) {
            Log.e(TAG, "Failed to copy audio from " + uri, e);
            return 0;
        }
    }

    private static byte[] readAll(File file) throws Exception {
        byte[] bytes = new byte[(int) file.length()];
        try (java.io.FileInputStream in = new java.io.FileInputStream(file)) {
            int off = 0;
            while (off < bytes.length) {
                int n = in.read(bytes, off, bytes.length - off);
                if (n < 0) break;
                off += n;
            }
        }
        return bytes;
    }

    private static String extraString(Intent intent, String key, String fallback) {
        if (intent == null) return fallback;
        String value = intent.getStringExtra(key);
        return value == null ? fallback : value;
    }

    private static long extraLong(Intent intent, String key, long fallback) {
        if (intent == null) return fallback;
        Bundle extras = intent.getExtras();
        if (extras == null || !extras.containsKey(key)) return fallback;
        Object raw = extras.get(key);
        if (raw instanceof Number) return ((Number) raw).longValue();
        if (raw instanceof String) {
            try {
                return Long.parseLong((String) raw);
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        if (Build.VERSION.SDK_INT >= 12) {
            return extras.getLong(key, fallback);
        }
        return fallback;
    }

    private static boolean extraBoolean(Intent intent, String key, boolean fallback) {
        if (intent == null) return fallback;
        Bundle extras = intent.getExtras();
        if (extras == null || !extras.containsKey(key)) return fallback;
        Object raw = extras.get(key);
        if (raw instanceof Boolean) return (Boolean) raw;
        if (raw instanceof Number) return ((Number) raw).intValue() != 0;
        if (raw instanceof String) {
            String s = ((String) raw).trim();
            if ("true".equalsIgnoreCase(s) || "1".equals(s)) return true;
            if ("false".equalsIgnoreCase(s) || "0".equals(s)) return false;
        }
        return extras.getBoolean(key, fallback);
    }
}
