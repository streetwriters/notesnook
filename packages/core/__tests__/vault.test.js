import { StorageInterface, databaseTest, noteTest, TEST_NOTE } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

test("create vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    const vaultKey = await db.storage.read("vaultKey");
    expect(vaultKey).toBeDefined();
    expect(vaultKey.iv).toBeDefined();
    expect(vaultKey.cipher).toBeDefined();
    expect(vaultKey.length).toBeDefined();
  }));

test("unlock vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    await expect(db.vault.unlock("password")).resolves.toBe(true);
  }));

test("unlock non-existent vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.unlock("password")).rejects.toThrow(/ERR_NO_VAULT/);
  }));

test("unlock vault with wrong password", () =>
  databaseTest().then(async (db) => {
    await db.vault.create("password");
    await expect(db.vault.unlock("passwrd")).rejects.toThrow(
      /ERR_WRONG_PASSWORD/
    );
  }));

test("lock a note when no vault has been created", () =>
  noteTest().then(async ({ db, id }) => {
    await expect(db.vault.add(id)).rejects.toThrow(/ERR_NO_VAULT/);
  }));

test("lock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = db.notes.note(id);

    expect(note.headline).toBe("");

    const content = await db.content.raw(note.data.contentId, false);
    expect(content.noteId).toBeDefined();
    expect(content.data.iv).toBeDefined();
    expect(content.data.cipher).toBeDefined();
  }));

test("locked note is not favorited", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = db.notes.note(id);

    expect(note.data.favorite).toBeFalsy();
  }));

test("unlock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = await db.vault.open(id, "password");
    expect(note.id).toBe(id);
    expect(note.content.data).toBeDefined();
    expect(note.content.type).toBe(TEST_NOTE.content.type);
  }));

test("unlock a note permanently", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    await db.vault.remove(id, "password");
    const note = db.notes.note(id);
    expect(note.id).toBe(id);
    expect(note.headline).not.toBe("");
    const content = await db.content.raw(note.data.contentId);
    expect(content.data).toBeDefined();
    expect(typeof content.data).toBe("string");
  }));

test("save a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = db.notes.note(id).data;
    await db.vault.save(note);

    const content = await db.content.raw(note.contentId);
    const contentData = JSON.parse(content.data.cipher);

    expect(contentData.iv).toBeUndefined();
    expect(contentData.cipher).toBeUndefined();
    expect(contentData.key).toBeUndefined();
  }));

test("save an edited locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = db.notes.note(id).data;
    await db.vault.save({
      ...note,
      content: { type: "tiptap", data: "<p>hello world</p>" },
    });

    const content = await db.content.raw(note.contentId);
    const contentData = JSON.parse(content.data.cipher);

    expect(contentData.iv).toBeUndefined();
    expect(contentData.cipher).toBeUndefined();
    expect(contentData.key).toBeUndefined();
  }));

test("change vault password", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    await expect(db.vault.open(id, "password")).resolves.toBeDefined();

    await db.vault.changePassword("password", "newPassword");

    await expect(db.vault.open(id, "password")).rejects.toThrow();
    await expect(db.vault.open(id, "newPassword")).resolves.toBeDefined();
  }));
