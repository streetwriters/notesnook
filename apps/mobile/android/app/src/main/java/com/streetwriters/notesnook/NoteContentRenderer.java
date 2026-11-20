package com.streetwriters.notesnook;

import android.graphics.Color;
import android.graphics.Typeface;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.RelativeSizeSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;
import android.text.style.TypefaceSpan;
import android.text.style.UnderlineSpan;

import com.streetwriters.notesnook.datatypes.NoteBlock;
import com.streetwriters.notesnook.datatypes.Span;

import java.util.List;

/**
 * Turns the blocks the app derives from a note's content into styled text a RemoteViews
 * TextView can show. Only spans that survive being parceled to the launcher are used.
 */
final class NoteContentRenderer {

    private NoteContentRenderer() {}

    static CharSequence render(List<NoteBlock> blocks) {
        SpannableStringBuilder out = new SpannableStringBuilder();
        for (NoteBlock block : blocks) {
            if (out.length() > 0) out.append('\n');
            appendBlock(out, block);
        }
        return out;
    }

    private static void appendBlock(SpannableStringBuilder out, NoteBlock block) {
        String type = block.getType() == null ? "paragraph" : block.getType();
        String indent = repeat("    ", block.getDepth());

        switch (type) {
            case "heading": {
                int start = out.length();
                appendInline(out, block);
                out.setSpan(new StyleSpan(Typeface.BOLD), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                out.setSpan(new RelativeSizeSpan(block.getLevel() == 1 ? 1.15f : 1.05f), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                break;
            }
            case "listItem":
                out.append(indent);
                out.append(block.getNumber() != null ? block.getNumber() + ". " : "• ");
                appendInline(out, block);
                break;
            case "todo": {
                out.append(indent);
                out.append(block.isChecked() ? "☑ " : "☐ ");
                int start = out.length();
                appendInline(out, block);
                if (block.isChecked()) {
                    out.setSpan(new StrikethroughSpan(), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                break;
            }
            case "quote": {
                out.append("┃ ");
                int start = out.length();
                appendInline(out, block);
                out.setSpan(new StyleSpan(Typeface.ITALIC), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                break;
            }
            case "callout": {
                Integer accent = block.getAccentColor();
                int color = accent != null ? accent : Color.GRAY;
                int barStart = out.length();
                out.append("▎ ");
                out.setSpan(new ForegroundColorSpan(color), barStart, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                int start = out.length();
                appendInline(out, block);
                if (block.isTitle()) {
                    out.setSpan(new StyleSpan(Typeface.BOLD), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                    out.setSpan(new ForegroundColorSpan(color), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                break;
            }
            case "tableRow": {
                int start = out.length();
                boolean first = true;
                for (List<Span> cell : block.getCells()) {
                    if (!first) out.append("  │  ");
                    first = false;
                    appendSpans(out, cell);
                }
                if (block.isHeaderRow()) {
                    out.setSpan(new StyleSpan(Typeface.BOLD), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                break;
            }
            case "code": {
                int start = out.length();
                out.append(block.getText());
                out.setSpan(new TypefaceSpan("monospace"), start, out.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                break;
            }
            case "rule":
                out.append("——————");
                break;
            default:
                appendInline(out, block);
        }
    }

    /**
     * Appends a block's styled spans. Blocks written before spans existed only carry plain text.
     */
    private static void appendInline(SpannableStringBuilder out, NoteBlock block) {
        List<Span> spans = block.getSpans();
        if (spans.isEmpty()) {
            out.append(block.getText());
            return;
        }
        appendSpans(out, spans);
    }

    private static void appendSpans(SpannableStringBuilder out, List<Span> spans) {
        for (Span span : spans) {
            int start = out.length();
            out.append(span.getText());
            int end = out.length();
            if (end == start) continue;

            if (span.isBold() && span.isItalic()) {
                out.setSpan(new StyleSpan(Typeface.BOLD_ITALIC), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            } else if (span.isBold()) {
                out.setSpan(new StyleSpan(Typeface.BOLD), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            } else if (span.isItalic()) {
                out.setSpan(new StyleSpan(Typeface.ITALIC), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
            if (span.isStrikethrough()) {
                out.setSpan(new StrikethroughSpan(), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
            if (span.isCode()) {
                out.setSpan(new TypefaceSpan("monospace"), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
            Integer background = span.getBackgroundColor();
            if (background != null) {
                out.setSpan(new BackgroundColorSpan(background), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                out.setSpan(new ForegroundColorSpan(readableTextColor(background)), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
            if (span.isLink() || span.isUnderline()) {
                out.setSpan(new UnderlineSpan(), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
    }

    private static int readableTextColor(int background) {
        double luminance = (0.299 * Color.red(background)
                + 0.587 * Color.green(background)
                + 0.114 * Color.blue(background)) / 255;
        return luminance > 0.6 ? Color.BLACK : Color.WHITE;
    }

    private static String repeat(String value, int count) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < count; i++) builder.append(value);
        return builder.toString();
    }
}
