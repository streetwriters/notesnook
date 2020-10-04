function loadTCheckout() {
  return new Promise((resolve) => {
    const config = {
      app: { merchant: "250327951921", iframeLoad: "checkout" },
      cart: {
        host: "https://secure.2checkout.com",
        customization: "inline",
      },
    };
    var script = document.createElement("script");
    script.src =
      "https://secure.avangate.com/checkout/client/twoCoInlineCart.js";
    script.async = true;
    var firstScriptElement = document.getElementsByTagName("script")[0];
    script.onload = function () {
      for (var namespace in config) {
        if (config.hasOwnProperty(namespace)) {
          window["TwoCoInlineCart"].setup.setConfig(
            namespace,
            config[namespace]
          );
        }
      }
      window["TwoCoInlineCart"].register();
      resolve();
    };

    firstScriptElement.parentNode.insertBefore(script, firstScriptElement);
  });
}

async function upgrade(user) {
  if (!window.TwoCoInlineCart) {
    await loadTCheckout();
  }

  const { TwoCoInlineCart: cart } = window;
  if (!cart) return;
  cart.setup.setMerchant("250327951921"); // your Merchant code
  cart.billing.setEmail(user.email); // customer email address
  cart.shipping.setEmail(user.email); // customer Delivery email
  cart.cart.setExternalCustomerReference(user.Id);
  cart.cart.setTest(true);

  cart.products.add({
    code: "notesnook",
    quantity: 1,
  });

  cart.cart.setCartLockedFlag(true);
  cart.cart.checkout().then(console.log); // start checkout process
}

export { upgrade };
