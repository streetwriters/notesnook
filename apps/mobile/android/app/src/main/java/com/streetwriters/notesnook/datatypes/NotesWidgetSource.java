package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

@Keep
public class NotesWidgetSource {
    private String key;
    private String type;
    private String id;
    private String title;

    public static NotesWidgetSource defaultSource(String title) {
        NotesWidgetSource source = new NotesWidgetSource();
        source.key = "recent";
        source.type = "recent";
        source.title = title;
        return source;
    }

    public String getKey() {
        return key;
    }

    public String getType() {
        return type;
    }

    public String getId() {
        return id;
    }

    public boolean hasScope() {
        return id != null && ("notebook".equals(type) || "tag".equals(type) || "color".equals(type));
    }

    public String getTitle() {
        return title == null ? "" : title;
    }
}
