package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

import java.util.concurrent.TimeUnit;

@Keep
public class Reminder extends BaseItem {
    private String title;
    private String description;
    private String formattedTime;
    private String priority; // "silent", "vibrate", "urgent"
    private long date;
    private String mode; // "repeat", "once", "permanent"
    private String recurringMode; // "week", "month", "day", "year"
    private int[] selectedDays;
    private boolean localOnly;
    private boolean disabled;
    private long snoozeUntil;

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public long getDate() {
        return date;
    }

    public void setDate(long date) {
        this.date = date;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getRecurringMode() {
        return recurringMode;
    }

    public void setRecurringMode(String recurringMode) {
        this.recurringMode = recurringMode;
    }

    public int[] getSelectedDays() {
        return selectedDays;
    }

    public void setSelectedDays(int[] selectedDays) {
        this.selectedDays = selectedDays;
    }

    public boolean isLocalOnly() {
        return localOnly;
    }

    public void setLocalOnly(boolean localOnly) {
        this.localOnly = localOnly;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public long getSnoozeUntil() {
        return snoozeUntil;
    }

    public void setSnoozeUntil(long snoozeUntil) {
        this.snoozeUntil = snoozeUntil;
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public String formatTime(long timeInMillis) {
        long currentTime = System.currentTimeMillis();
        long diff = timeInMillis - currentTime;

        if (diff < TimeUnit.MINUTES.toMillis(1)) {
            return "in " + (diff / 1000) + " seconds";
        } else if (diff < TimeUnit.HOURS.toMillis(1)) {
            long minutes = TimeUnit.MILLISECONDS.toMinutes(diff);
            return "in " + minutes + " minute" + (minutes > 1 ? "s" : "");
        } else if (diff < TimeUnit.DAYS.toMillis(1)) {
            long hours = TimeUnit.MILLISECONDS.toHours(diff);
            return "in " + hours + " hour" + (hours > 1 ? "s" : "");
        } else if (diff < TimeUnit.DAYS.toMillis(2)) {
            return "tomorrow";
        } else if (diff < TimeUnit.DAYS.toMillis(7)) {
            long days = TimeUnit.MILLISECONDS.toDays(diff);
            return "in " + days + " day" + (days > 1 ? "s" : "");
        } else if (diff < TimeUnit.DAYS.toMillis(30)) {
            long weeks = TimeUnit.MILLISECONDS.toDays(diff) / 7;
            return "in " + weeks + " week" + (weeks > 1 ? "s" : "");
        } else if (diff < TimeUnit.DAYS.toMillis(365)) {
            long months = TimeUnit.MILLISECONDS.toDays(diff) / 30;
            return "in " + months + " month" + (months > 1 ? "s" : "");
        } else {
            long years = TimeUnit.MILLISECONDS.toDays(diff) / 365;
            return "in " + years + " year" + (years > 1 ? "s" : "");
        }
    }
}