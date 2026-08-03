---
title: Setting reminders on notes
pageTitle: How do I set a reminder on a note in Notesnook?
description: Set one-time, recurring and permanent reminders on your Notesnook notes, snooze them from the notification, and change the sound and snooze time.
keywords:
  - notesnook reminders
  - reminder on a note
  - recurring reminders notes app
schema: howto
---

# Creating reminders

Reminders help you stay on top of your important notes. You can create one-time or recurring reminders with custom notification settings.

Free accounts can have up to 10 active reminders at a time. Essential raises the cap to 50, and Pro and Believer are unlimited — see [Plans & limits](/plans-and-limits). Deactivated reminders, and one-time reminders whose time has already passed, don't count towards the cap.

## Adding a reminder to a note

:::tabs key:platform
== Desktop/Web

1. Right click a note to open the `Note properties` menu
2. Click `{{remindMe}}` to open the add reminder dialog
3. Enter a title for the reminder and description (optional)
4. Choose your reminder type:
   - **Once**: Set a specific date and time
   - **Repeat** (paid plans only): Create a recurring reminder (daily, weekly, monthly, or yearly)
5. Select your notification preference (Silent, Vibrate, or Urgent)
6. Click `{{add}}` to save the reminder

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap `{{remindMe}}` to open the add reminder dialog
3. Enter a title for the reminder and description (optional)
4. Choose your reminder type:
   - **Once**: Set a specific date and time
   - **Repeat** (paid plans only): Create a recurring reminder (daily, weekly, monthly, or yearly)
   - **Permanent** _(Android only)_: A persistent reminder that shows up every day
5. Select your notification preference (Silent, Vibrate, or Urgent)
6. Tap the checkmark button on top right to save the reminder

:::

## Creating a standalone reminder

You can also create reminders without attaching them to a specific note. This is useful for general tasks or events.

:::tabs key:platform
== Desktop/Web

1. Go to the `{{reminders}}` screen from the side menu
2. Click the add reminder button (![Plus icon](/plus-reminder-icon.png)) on top right
3. Enter a title for the reminder and description (optional)
4. Choose your reminder type (Once or Repeat)
5. Select your notification preference (Silent, Vibrate, or Urgent)
6. Click `{{add}}` to save the reminder

== Mobile

1. Go to the `{{reminders}}` screen from the side menu
2. Tap the add reminder button (![Plus icon](/plus-button-desktop.png)) on bottom right
3. Enter a title for the reminder and description (optional)
4. Choose your reminder type (Once, Repeat, or Permanent on Android)
5. Select your notification preference (Silent, Vibrate, or Urgent)
6. Tap the checkmark button on top right to save the reminder

:::

## Configuring recurring reminders <PlanTag plan="essential" />

::: info Recurring reminders are a paid feature
Recurring reminders can only be used if you are on a paid plan — Essential, Pro or Believer. See [Plans & limits](/plans-and-limits).

:::

When you select **Repeat** mode, you can customize how often you want to be reminded:

- **Daily**: Get reminded every single day at your chosen time
- **Weekly**: Select specific days of the week (e.g., weekdays only)
- **Monthly**: Pick specific dates of the month
- **Yearly**: Choose the month and day for your yearly reminder

## Notification preferences

Choose how you want to be notified:

- **Silent**: Receive a notification without sound or vibration
- **Vibrate**: Get a notification with vibration
- **Urgent**: Receive a notification with sound and vibration

::: info
Reminders require notification permissions. You'll be asked to enable notifications when you create your first reminder.

:::

## Editing or viewing reminders

To edit an existing reminder, go to `{{reminders}}` screen from the side menu and select the reminder you want to edit. You can change all reminder settings, including the date, time, and recurrence pattern.

To see all reminders attached to a note, open the note properties go to `{{reminders}}`. This will show you a list of all reminders associated with that note.

## Activate or deactivate a reminder

Deactivating a reminder stops it from notifying you without deleting it, so you can turn it back on later. A deactivated reminder is labelled `{{disabled}}` in the reminders list and stops counting towards your active reminder cap.

:::tabs key:platform
== Desktop/Web

1. Go to the `{{reminders}}` screen from the side menu.
2. Right click the reminder.
3. Click `{{deactivate}}` to switch it off, or `{{activate}}` to switch it back on.

== Mobile

1. Go to the `{{reminders}}` screen from the side menu.
2. Tap the ![Three dot button](/three-dot-button.png) button on the reminder.
3. Tap `{{turnOffReminder}}` to switch it off, or `{{turnOnReminder}}` to switch it back on.

:::

## Snooze a reminder

When a reminder fires you can push it back instead of dismissing it.

:::tabs key:platform
== Desktop/Web

1. Click the reminder notification. The reminder preview opens.
2. Under `{{remindMeIn}}`, click `5 minutes`, `10 minutes`, `15 minutes` or `1 hour`.

The reminder fires again after the interval you picked.

== Mobile

1. Expand the reminder notification in your notification shade.
2. Tap the snooze action on it — `Remind in 5 min` on Android, `Remind me in 5 min` on iOS. Both labels show your default snooze time.

The action uses your default snooze time, which is 5 minutes until you change it. Recurring reminders also get a `{{disable}}` action on the notification, which deactivates the reminder.

:::

### Change the default snooze time _(mobile)_

1. Go to `{{settings}}` > `{{productivity}}` > `{{reminders}}`.
2. Tap `{{defaultSnoozeTime}}` and enter the number of minutes.

The default is `5` minutes. This is the interval the snooze button on a reminder notification uses.

### Change the reminder notification sound _(Android only)_

1. Go to `{{settings}}` > `{{productivity}}` > `{{reminders}}`.
2. Tap `{{changeNotificationSound}}`.

On Android 8 and above this opens the system notification channel settings for Notesnook's urgent reminder channel, where the sound is set. On older Android versions you pick the sound from a list inside the app. There is no sound setting on iOS.

## Permanent reminders <PlanTag plan="essential" note="Android only"/>

**Permanent reminders** are available only on Android devices. Unlike one-time or recurring reminders, permanent reminders persist every day and won't disappear after triggering. This is useful for important daily tasks or notes you want constant access to.

## Related pages

- [Note actions](/notes/note-actions) — pin, duplicate, read-only, print and more
- [Pin to notifications](/mobile-integration/pin-notes-to-notifications) — a note that lives in your shade
- [Task lists](/rich-text-editor/task-and-todo-lists) — to-do lists inside a note
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
