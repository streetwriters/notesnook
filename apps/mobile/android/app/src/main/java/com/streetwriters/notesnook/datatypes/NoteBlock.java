package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

import java.util.Collections;
import java.util.List;

@Keep
public class NoteBlock {
    private String type;
    private String text;
    private List<Span> spans;
    private int level;
    private int depth;
    private Integer number;
    private boolean checked;
    private boolean title;
    private String accent;
    private List<List<Span>> cells;
    private boolean header;

    public String getType() {
        return type;
    }

    public String getText() {
        return text == null ? "" : text;
    }

    public List<Span> getSpans() {
        return spans == null ? Collections.<Span>emptyList() : spans;
    }

    public int getLevel() {
        return level;
    }

    public int getDepth() {
        return depth;
    }

    public Integer getNumber() {
        return number;
    }

    public boolean isChecked() {
        return checked;
    }

    public boolean isTitle() {
        return title;
    }

    public Integer getAccentColor() {
        if (accent == null || accent.isEmpty()) return null;
        try {
            return android.graphics.Color.parseColor(accent);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public List<List<Span>> getCells() {
        return cells == null ? Collections.<List<Span>>emptyList() : cells;
    }

    public boolean isHeaderRow() {
        return header;
    }
}
