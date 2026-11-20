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
        if (background == null || background.isEmpty()) return null;
        try {
            return android.graphics.Color.parseColor(background);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isLink() {
        return url != null && !url.isEmpty();
    }
}
