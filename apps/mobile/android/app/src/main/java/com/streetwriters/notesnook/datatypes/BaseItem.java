package com.streetwriters.notesnook.datatypes;

import androidx.annotation.Keep;

@Keep
public class BaseItem {
    private String id;
    private String type;
    private long dateModified;
    private long dateCreated;
    private Boolean migrated;
    private Boolean remote;
    private Boolean synced;
    private Boolean deleted;
    /**
     * @deprecated only kept here for migration purposes
     */
    private Object deleteReason; // Assuming never can be represented as Object

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getDateModified() {
        return dateModified;
    }

    public void setDateModified(long dateModified) {
        this.dateModified = dateModified;
    }

    public long getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(long dateCreated) {
        this.dateCreated = dateCreated;
    }

    public Boolean getMigrated() {
        return migrated;
    }

    public void setMigrated(Boolean migrated) {
        this.migrated = migrated;
    }

    public Boolean getRemote() {
        return remote;
    }

    public void setRemote(Boolean remote) {
        this.remote = remote;
    }

    public Boolean getSynced() {
        return synced;
    }

    public void setSynced(Boolean synced) {
        this.synced = synced;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Object getDeleteReason() {
        return deleteReason;
    }

    public void setDeleteReason(Object deleteReason) {
        this.deleteReason = deleteReason;
    }
}