package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

@Keep
public class Reminder extends BaseItem {
    private String title;
    private String description;
    private String formattedTime;
    private String formattedTimeOfDay; // e.g. "5:00 PM"
    private String formattedDateTime; // e.g. "12-05-2026, 5:00 PM"
    private long triggerDate; // absolute time this reminder next fires
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

    public String getFormattedTimeOfDay() {
        return formattedTimeOfDay;
    }

    public void setFormattedTimeOfDay(String formattedTimeOfDay) {
        this.formattedTimeOfDay = formattedTimeOfDay;
    }

    public String getFormattedDateTime() {
        return formattedDateTime;
    }

    public void setFormattedDateTime(String formattedDateTime) {
        this.formattedDateTime = formattedDateTime;
    }

    public long getTriggerDate() {
        return triggerDate;
    }

    public void setTriggerDate(long triggerDate) {
        this.triggerDate = triggerDate;
    }
}