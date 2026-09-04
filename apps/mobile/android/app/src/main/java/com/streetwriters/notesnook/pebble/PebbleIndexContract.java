package com.streetwriters.notesnook.pebble;

/**
 * Shared names for the on-device Pebble Index 01 → Notesnook intent.
 * Keep in lockstep with Pebble Core's IndexLocalCaptureContract.
 */
public final class PebbleIndexContract {
    private PebbleIndexContract() {}

    public static final String ACTION = "com.streetwriters.notesnook.action.INDEX_CAPTURE";
    public static final String RECEIVE_PERMISSION =
            "com.streetwriters.notesnook.permission.RECEIVE_INDEX_CAPTURE";

    public static final String PEBBLE_PACKAGE = "coredevices.coreapp";

    public static final String EXTRA_TRANSCRIPTION = "transcription";
    public static final String EXTRA_RECORDED_AT = "recordedAt";
    public static final String EXTRA_CLIENT = "client";
    public static final String EXTRA_RECORDING_ID = "recordingId";
    public static final String EXTRA_TRIGGER = "trigger";
    public static final String EXTRA_PAYLOAD_MODE = "payloadMode";
    public static final String EXTRA_AUDIO_SIZE = "audioSize";
    public static final String EXTRA_AUDIO_URI = "audioUri";
    public static final String EXTRA_AUDIO_BASE64 = "audioBase64";
    public static final String EXTRA_TEST = "test";
    public static final String EXTRA_KIND = "kind";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_HAS_DEADLINE = "hasDeadline";
    public static final String EXTRA_DEADLINE_EPOCH_MS = "deadlineEpochMs";
    public static final String EXTRA_DEADLINE_ISO = "deadlineIso";
    public static final String EXTRA_NOTIFY_BEFORE_SECONDS = "notifyBeforeSeconds";

    public static final String KIND_NOTE = "note";
    public static final String KIND_REMINDER = "reminder";

    public static final String PREFS = "pebble_index";
    public static final String PREF_CAPTURE_ENABLED = "capture_enabled";
    public static final String PREF_KEEP_ALIVE = "keep_alive";
    public static final String PREF_REMINDER_PRIORITY = "reminder_priority";

    public static final String INBOX_DIR = "pebble-index/inbox";
    public static final String CHANNEL_ID = "com.streetwriters.notesnook.pebble_index";
    public static final String CHANNEL_NAME = "Pebble Index 01";

    public static final int KEEP_ALIVE_NOTIFICATION_ID = 41;
    public static final int CAPTURE_NOTIFICATION_ID = 42;

    public static final String HEADLESS_TASK = "com.streetwriters.notesnook.PEBBLE_INDEX_CAPTURE";
}
