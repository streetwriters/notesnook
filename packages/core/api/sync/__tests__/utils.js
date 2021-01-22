import "jest-fetch-mock";
import Storage from "../../../__mocks__/storage.mock";

const SUCCESS_LOGIN_RESPONSE = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  scope: "sync",
  expires_in: 3600,
};

const SUCCESS_USER_RESPONSE = {
  id: "0",
  email: process.env.EMAIL,
  salt: "",
  vaultKey: null,
};

async function login(db) {
  fetchMock
    .mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE), {
      headers: { "Content-Type": "application/json" },
    })
    .mockResponseOnce(JSON.stringify(SUCCESS_USER_RESPONSE), {
      headers: { "Content-Type": "application/json" },
    });

  await db.user.login(
    SUCCESS_USER_RESPONSE.email,
    "password",
    true,
    "password"
  );
}

function mainCollectionParams(collection, itemKey, item) {
  async function addItem(db) {
    const id = await db[collection].add(item);
    return db[collection][itemKey](id).data;
  }

  async function editItem(db, item) {
    await db[collection].add({ ...item, title: "dobido" });
  }

  function getItem(db, item) {
    return db[collection][itemKey](item.id).data;
  }

  return [collection, addItem, editItem, getItem, itemKey];
}

function tagsCollectionParams(collection, item, type) {
  async function addItem(db) {
    const id = await db[collection].add(item, 20);
    return db[collection].tag(id);
  }

  async function editItem(db) {
    await db[collection].add(item, 240);
  }

  function getItem(db, item) {
    return db[collection].tag(item.id);
  }

  return [collection, addItem, editItem, getItem, type];
}

function getEncrypted(item) {
  return Storage.encrypt("password", JSON.stringify(item));
}

export { tagsCollectionParams, mainCollectionParams, login, getEncrypted };
