import { StorageInterface, databaseTest, noteTest, TEST_NOTE } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

test("create vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    const vaultKey = await db.context.read("vaultKey");
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
    db.vault
      .unlock("password")
      .catch((err) => expect(err.message).toBe("ERR_NO_VAULT"));
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

    const delta = await db.delta.raw(note.data.content.delta);
    expect(delta.noteId).toBeDefined();
    expect(delta.data.iv).toBeDefined();
    expect(delta.data.cipher).toBeDefined();

    const text = await db.text.raw(note.data.content.text);
    expect(text.noteId).toBeDefined();
    expect(text.data.iv).toBeDefined();
    expect(text.data.cipher).toBeDefined();
  }));

test("unlock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = await db.vault.open(id, "password");
    expect(note.id).toBe(id);
    expect(note.content.delta.ops).toBeDefined();
  }));

test("unlock a note permanently", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    await db.vault.remove(id, "password");
    const note = db.notes.note(id);
    expect(note.id).toBe(id);
    const delta = await db.delta.raw(note.data.content.delta);
    expect(delta.data.ops).toBeDefined();
    expect(typeof delta.data.ops).toBe("object");
  }));
