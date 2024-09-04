---
title: What are merge conflicts?
description: Merge conflicts occur when two or more devices edit the same note and then attempt to sync these changes. Since each device has a different version of the note, Notesnook cannot automatically determine which version should take precedence, resulting in a merge conflict.
---

# What are merge conflicts?

Merge conflicts occur when two or more devices edit the same note and then attempt to sync these changes. Since each device has a different version of the note, Notesnook cannot automatically determine which version should take precedence, resulting in a merge conflict.

### Example:

Let’s say you’re using Notesnook on both your laptop and smartphone. You edit a note on your laptop making a lot of changes. Later, while commuting, you remember something important and edit the same note on your smartphone. When both devices eventually reconnect to the internet and sync, Notesnook detects that there are two different versions of the same note and triggers a merge conflict.

## Why do merge conflicts happen?

Merge conflicts happen because Notesnook cannot safely figure out which version of the name you want to keep. Unlike some apps that prioritize the most recent changes or attempt to merge content automatically (which can result in loss of important data or unwanted changes), Notesnook ensures you have full control over which version of a note you want to keep.

> info Both edits must be at least a minute apart
>
> The changes on both devices must be at least a minute apart for a merge conflict to occur. For example, if you are editing on both devices simultaneously (and both devices have a working sync), a merge conflict will NOT occur.

### Why doesn't Notesnook automatically resolve merge conflicts?

1. Automatic conflict resolution can lead to unintended data loss. For example, if both versions of a note contain unique but crucial information, merging them automatically might result in losing an important part of the information.
2. By allowing you to manually resolve conflicts, you can review each version of the note and decide which one is correct or if you want to keep both (i.e. both versions contain important information).

## Where do I find the conflicted notes?

Conflicted notes appear at the very top of your notes list.

1. Navigate to Notes
2. If you have any conflicts, you'll see them under the **Conflicted** group

## How to resolve merge conflicts

### [Desktop/Web](#/tab/web)

To resolve a merge conflict on your desktop or web app, follow these steps:

1. Locate the conflicted note at the top of your notes list.
2. Click on the note to open the conflict resolution screen.
3. On the conflict resolution screen, you’ll see two versions of your note side by side:
   1. **Current Note** is the version from the device you are using.
   2. **Incoming Note** is the version coming from the other device.
      ![](/static/merge-conflicts-resolution-screen.png)
   3. The red and green highlights on the left side show the changes you made. Red indicates deletions and green indicates additions.
4. Review both versions and decide which one you want to keep.
5. Click the **Keep** button on the version you want to retain.
6. Click the **Discard** button on the version you don’t want to keep, or press **Save a Copy** if you want to keep both versions.
   ![](/static/merge-conflicts-resolution-screen-2.png)

### [Mobile](#/tab/mobile)

To resolve a merge conflict on your mobile device, follow these steps:

1. Locate the conflicted note at the top of your notes list.
2. Tap on the note to open the conflict resolution screen.
3. On the conflict resolution screen, you’ll see two versions of your note, one above the other:
   1. **This Device** is the version from the device you are using.
   2. **Incoming** is the version coming from the other device.
   <p><img src="/static/merge-conflicts-resolution-screen-mobile.png" alt="drawing" height="414"/></p>
4. Review both versions and decide which one you want to keep.
5. Press the **Keep** button on the version you want to retain.
6. Press the **Discard** button on the version you don’t want to keep, or press **Save a Copy** if you want to keep both versions.
   <p><img src="/static/merge-conflicts-resolution-screen-mobile-2.png" alt="drawing" height="414"/></p>

---
