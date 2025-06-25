package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

@Keep
public class Note extends BaseItem {
private String title;
private String headline;
private String contentId;
private Boolean locked;
private boolean pinned;
private boolean favorite;
private boolean localOnly;
private boolean conflicted;
private boolean readonly;
private long dateEdited;
private Object dateDeleted; // Assuming null can be represented as Object
private Object itemType; // Assuming null can be represented as Object
private Object deletedBy; // Assuming null can be represented as Object

// Getters and Setters
public String getTitle() {
    return title;
}

public void setTitle(String title) {
    this.title = title;
}

public String getHeadline() {
    return headline;
}

public void setHeadline(String headline) {
    this.headline = headline;
}

public String getContentId() {
    return contentId;
}

public void setContentId(String contentId) {
    this.contentId = contentId;
}

public Boolean getLocked() {
    return locked;
}

public void setLocked(Boolean locked) {
    this.locked = locked;
}

public boolean isPinned() {
    return pinned;
}

public void setPinned(boolean pinned) {
    this.pinned = pinned;
}

public boolean isFavorite() {
    return favorite;
}

public void setFavorite(boolean favorite) {
    this.favorite = favorite;
}

public boolean isLocalOnly() {
    return localOnly;
}

public void setLocalOnly(boolean localOnly) {
    this.localOnly = localOnly;
}

public boolean isConflicted() {
    return conflicted;
}

public void setConflicted(boolean conflicted) {
    this.conflicted = conflicted;
}

public boolean isReadonly() {
    return readonly;
}

public void setReadonly(boolean readonly) {
    this.readonly = readonly;
}

public long getDateEdited() {
    return dateEdited;
}

public void setDateEdited(long dateEdited) {
    this.dateEdited = dateEdited;
}

public Object getDateDeleted() {
    return dateDeleted;
}

public void setDateDeleted(Object dateDeleted) {
    this.dateDeleted = dateDeleted;
}

public Object getItemType() {
    return itemType;
}

public void setItemType(Object itemType) {
    this.itemType = itemType;
}

public Object getDeletedBy() {
    return deletedBy;
}

public void setDeletedBy(Object deletedBy) {
    this.deletedBy = deletedBy;
}
}