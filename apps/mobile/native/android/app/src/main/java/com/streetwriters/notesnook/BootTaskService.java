package com.streetwriters.notesnook;

import android.content.Intent;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import javax.annotation.Nullable;

public class BootTaskService extends HeadlessJsTaskService {

  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
      return new HeadlessJsTaskConfig(
              "com.streetwriters.notesnook.BOOT_TASK",
              Arguments.createMap(),
              30000, // timeout for the task
              false // optional: defines whether or not the task is allowed in foreground. Default is false
      );
  }
}