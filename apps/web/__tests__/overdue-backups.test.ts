/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { config, kv, createBackup, tasks } = vi.hoisted(() => ({
  config: {} as Record<string, number>,
  kv: {} as Record<string, number | undefined>,
  createBackup: vi.fn(async () => {}),
  tasks: {} as Record<string, { cron: string; action: () => void }>
}));

vi.mock("../src/utils/config", () => ({
  default: { get: (key: string, def: number) => config[key] ?? def }
}));
vi.mock("../src/common/index", () => ({
  createBackup,
  verifyAccount: vi.fn()
}));
vi.mock("../src/common/db", () => ({
  db: {
    backup: {
      lastBackupTime: async () => kv.lastBackupTime,
      lastFullBackupTime: async () => kv.lastFullBackupTime,
      updateBackupTime: async () => {}
    }
  }
}));
vi.mock("../src/stores/app-store", () => ({ store: {} }));
vi.mock("../src/stores/setting-store", () => ({
  useStore: { getState: () => ({ refreshBackupTime: async () => {} }) }
}));
vi.mock("../src/components/icons", () => ({
  Backup: {},
  User: {},
  Email: {},
  Warn: {}
}));
vi.mock("../src/navigation", () => ({}));
vi.mock("../src/utils/toast", () => ({ showToast: vi.fn() }));
vi.mock("../src/utils/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("../src/utils/task-scheduler", () => ({
  TaskScheduler: {
    stop: async (id: string) => {
      delete tasks[id];
    },
    register: async (id: string, cron: string, action: () => void) => {
      tasks[id] = { cron, action };
    }
  }
}));
vi.mock("../src/dialogs/recovery-key-dialog", () => ({}));
vi.mock("../src/dialogs/settings", () => ({}));
vi.mock("@notesnook/intl", () => ({
  strings: new Proxy({}, { get: () => () => "" })
}));

vi.hoisted(() => {
  globalThis.IS_TESTING = false;
  globalThis.IS_DESKTOP_APP = true;
});

const NOW = new Date(2026, 10, 4, 12, 0, 0);

let runOverdueBackups: typeof import("../src/common/notices").runOverdueBackups;
let scheduleBackups: typeof import("../src/common/notices").scheduleBackups;

beforeEach(async () => {
  vi.resetModules();
  ({ runOverdueBackups, scheduleBackups } = await import(
    "../src/common/notices"
  ));
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  createBackup.mockReset();
  createBackup.mockImplementation(async () => {});
  for (const key in config) delete config[key];
  for (const key in kv) delete kv[key];
  for (const key in tasks) delete tasks[key];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runOverdueBackups", () => {
  test("runs a partial backup once its scheduled time has passed", async () => {
    config.backupReminderOffset = 2;
    kv.lastBackupTime = new Date(2026, 10, 1, 12, 0, 0).getTime();

    await runOverdueBackups();

    expect(createBackup).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "partial", background: true })
    );
  });

  test("does not run a partial backup before its scheduled time", async () => {
    config.backupReminderOffset = 2;
    kv.lastBackupTime = new Date(2026, 10, 2, 9, 0, 0).getTime();

    await runOverdueBackups();

    expect(createBackup).not.toHaveBeenCalled();
  });

  test("runs only a full backup when both are due", async () => {
    config.backupReminderOffset = 1;
    config.fullBackupReminderOffset = 1;
    kv.lastBackupTime = new Date(2026, 9, 20).getTime();
    kv.lastFullBackupTime = new Date(2026, 9, 20).getTime();

    await runOverdueBackups();

    expect(createBackup).toHaveBeenCalledTimes(1);
    expect(createBackup).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "full", background: true })
    );
  });

  test("does not start another backup while one is running", async () => {
    config.fullBackupReminderOffset = 1;
    let finish = () => {};
    createBackup.mockImplementation(
      () => new Promise<void>((resolve) => (finish = resolve))
    );

    const first = runOverdueBackups();
    await vi.waitFor(() => expect(createBackup).toHaveBeenCalled());
    await runOverdueBackups();
    finish();
    await first;

    expect(createBackup).toHaveBeenCalledTimes(1);
  });
});

describe("scheduleBackups", () => {
  test("hourly check picks up a backup interval enabled after scheduling", async () => {
    await scheduleBackups();
    expect(createBackup).not.toHaveBeenCalled();

    config.fullBackupReminderOffset = 1;
    kv.lastFullBackupTime = new Date(2026, 9, 1).getTime();
    tasks["automatic-backups"].action();
    await vi.waitFor(() =>
      expect(createBackup).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "full" })
      )
    );
    expect(tasks["automatic-backups"].cron).toBe("0 0 * * * *");
  });

  test("runs overdue backups immediately on startup", async () => {
    config.backupReminderOffset = 1;
    kv.lastBackupTime = new Date(2026, 10, 3, 12, 0, 0).getTime();

    await scheduleBackups();

    expect(createBackup).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "partial" })
    );
  });

  test("does not retry a failed backup within retryAfter", async () => {
    const HOUR = 60 * 60 * 1000;
    config.backupReminderOffset = 1;
    kv.lastBackupTime = new Date(2026, 10, 3, 12, 0, 0).getTime();
    await runOverdueBackups();
    expect(createBackup).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(NOW.getTime() + HOUR / 2));
    await runOverdueBackups(HOUR);
    expect(createBackup).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(NOW.getTime() + HOUR + 1));
    await runOverdueBackups(HOUR);
    expect(createBackup).toHaveBeenCalledTimes(2);
  });
});
