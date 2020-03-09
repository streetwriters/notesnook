import { StorageInterface, databaseTest, noteTest, TEST_NOTE } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

test("create vault", () =>
  databaseTest().then(async db => {
    expect(await db.vault.create("password")).toBe(true);
    const lockKey = await db.context.read("lockKey");
    expect(lockKey).toBeDefined();
    expect(lockKey.iv).toBeDefined();
    expect(lockKey.cipher).toBeDefined();
  }));

test("unlock vault", () =>
  databaseTest().then(async db => {
    expect(await db.vault.create("password")).toBe(true);
    expect(await db.vault.unlock("password")).toBe(true);
  }));

test("unlock non-existent vault", () =>
  databaseTest().then(async db => {
    db.vault
      .unlock("password")
      .catch(err => expect(err.message).toBe("ERR_NO_VAULT"));
  }));

test("unlock vault with wrong password", () =>
  databaseTest().then(async db => {
    await db.vault.create("password");
    db.vault
      .unlock("passwrd")
      .catch(err => expect(err.message).toBe("ERR_WRNG_PWD"));
  }));

test("lock a note when no vault has been created", () =>
  noteTest().then(({ db, id }) => {
    db.vault.add(id).catch(err => {
      expect(err.message).toBe("ERR_NO_VAULT");
    });
  }));

test("lock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = db.notes.note(id);
    const { content } = note.data;
    expect(content.iv).toBeDefined();
    expect(content.cipher).toBeDefined();
    expect((await note.delta()).iv).toBeDefined();
  }));

test("unlock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = await db.vault.open(id, "password");
    expect(note.id).toBe(id);
    expect(note.content.text).toBe(TEST_NOTE.content.text);
    expect(note.content.delta.ops).toBeDefined();
  }));

test("unlock a note permanently", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    await db.vault.remove(id, "password");
    const note = db.notes.note(id);
    expect(note.id).toBe(id);
    expect(note.data.content.text).toBe(TEST_NOTE.content.text);
    expect((await note.delta()).ops).toBeDefined();
  }));
