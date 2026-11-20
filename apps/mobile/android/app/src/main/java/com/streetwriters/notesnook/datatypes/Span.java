package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

@Keep
public class Span {
    private String text;
    private int bold;
    private int italic;
    private int strike;
    private int code;
    private int underline;
    private String url;
    private String background;
    private String color;

    public String getText() {
        return text == null ? "" : text;
    }

    public boolean isBold() {
        return bold != 0;
    }

    public boolean isItalic() {
        return italic != 0;
    }

    public boolean isStrikethrough() {
        return strike != 0;
    }

    public boolean isCode() {
        return code != 0;
    }

    public boolean isUnderline() {
        return underline != 0;
    }

    public Integer getBackgroundColor() {
        return parseColor(background);
    }

    public Integer getTextColor() {
        return parseColor(color);
    }

    private static Integer parseColor(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return android.graphics.Color.parseColor(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isLink() {
        return url != null && !url.isEmpty();
    }
}
