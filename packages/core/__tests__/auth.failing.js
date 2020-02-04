/* import Auth from "../api/auth";
import StorageInterface from "../__mocks__/storage.mock";
import Database from "../api/database";

function databaseTest() {
  let db = new Database(StorageInterface);
  return db.init().then(() => db);
}

test("login user", () => {
  return databaseTest().then(db => {
    const auth = new Auth(db);
    return auth
      .login("thecodrr", "allatonce123")
      .then(user => {
        expect(user.username).toBe("thecodrr");
      })
      .catch(e => {
        expect(e.message).toContain("401 Unauthorized");
      });
  });
});

test("login invalid user", () => {
  return databaseTest().then(db => {
    const auth = new Auth(db);
    return auth.login("invalid_user", "invalid_password123").catch(e => {
      expect(e.message).toContain("Username or password is incorrect.");
    });
  });
});

test("signup user", () => {
  return databaseTest().then(db => {
    const auth = new Auth(db);
    return auth
      .signup("testuser123", "test_user@test.com", "allatonce123")
      .then(user => {
        expect(user.username).toBe("testuser123");
      })
      .catch(e => expect(e.message).toContain("is already taken"));
  });
});
 */
