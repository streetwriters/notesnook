import {
  tapByText,
  prepare,
  openSideMenu,
  elementById,
  visibleByText,
  sleep
} from "./utils";

const credentials = {
  username: "testaccount1@notesnook.com",
  password: "testaccount@123"
};

async function login() {
  await tapByText("Login to sync your notes.");
  await elementById("input.email").typeText(credentials.username);
  await elementById("input.password").typeText(credentials.password);
  await elementById("input.password").tapReturnKey();
}

async function deleteAccount() {
  await tapByText("Account Settings");
  await sleep(2000);
  await tapByText("Delete account");
  await elementById("input-value").typeText(credentials.password);
  await tapByText("Delete");
  await sleep(5000);
}

async function signup() {
  await tapByText("Login to sync your notes.");
  await sleep(500);
  await tapByText("Don't have an account? Sign up");
  await elementById("input.email").typeText(credentials.username);
  await elementById("input.password").typeText(credentials.password);
  await elementById("input.confirmPassword").typeText(credentials.password);
  await elementById("input.confirmPassword").tapReturnKey();
}

describe("AUTH", () => {
  it("Sign up", async () => {
    await prepare();
    await openSideMenu();
    await signup();
    await sleep(5000);
    await device.pressBack();
    await sleep(5000);
    await openSideMenu();
    await visibleByText("Tap here to sync your notes.");
  });

  it("Login to account", async () => {
    await prepare();
    await openSideMenu();
    await login();
    await sleep(10000);
    await openSideMenu();
    await visibleByText("Tap here to sync your notes.");
  });

  it("Delete account", async () => {
    await prepare();
    await openSideMenu();
    await login();
    await sleep(15000);
    await openSideMenu();
    await tapByText("Settings");
    await sleep(1000);
    await deleteAccount();
  });
});
