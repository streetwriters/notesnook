import { db } from "./index";

window.onload = async function (e) {
  const refno = getParameterByName("refno");
  if (refno) {
    console.log(refno);
    await db.user.upgrade(refno);
    window.location.hash = "#";
  }
};

function upgrade(user) {
  const { TwoCoInlineCart: cart } = window;
  if (!cart) return;
  cart.setup.setMerchant("250327951921"); // your Merchant code
  cart.billing.setEmail(user.email); // customer email address
  cart.shipping.setEmail(user.email); // customer Delivery email
  cart.cart.setTest(true);

  cart.products.add({
    code: "notesnook",
    quantity: 1,
  });

  cart.cart.setCartLockedFlag(true);
  cart.cart.checkout().then(console.log); // start checkout process
}
//http://localhost:3000/#/?refno=121822593&total=6.99&total-currency=USD&signature=06b250570afca7ccd6cb54d4d1dc63a7c4c3e1adf28be4cdb57a9f4569bfbbce

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export { upgrade };
