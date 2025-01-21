# Personalizing text editor

Customize some common editor defaults to get a personalized editing experience.

## Default font size and font family

# [Desktop/Web](#/tab/web)

The default font size and font family for all notes in the notes editor can be configured from `Settings > Editor Settings`.

# [Mobile](#/tab/mobile)

The default font size and font family for all notes in the notes editor can be configured from `Settings > Customization > Editor`.

---

> info
>
> Custom fonts are not supported yet.

## Default note title format in rich text editor

When you create a note in the text editor, a default title `Note $date$ $time$` is automatically set. You can change the default title format to better fit your needs.

Go to `Settings` > `Editor` > `Title format` to customize the title formatting.

### Supported formatting templates

**$date$**: Today's date

**$time$**: The current time

**$headline$**: Upto first 10 words of of a note headline

**$count$**: Current note count + 1

**$timestamp$**: Full date & time without any spaces or symbols (e.g. 202305261253)

**$timestampz$**: UTC offset added to _timestamp_

You can use a combination of these templates in the note title. For example `$headline$ - $date$` will become `Your note headline - 06-22-2023`.

## Paragraph spacing

By default when you press enter on a line in the text editor, a new paragraph is created with double spacing. You can go to `Settings` > `Customization` > `Editor` to turn off `Double spaced lines`.
