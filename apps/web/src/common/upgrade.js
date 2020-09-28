function loadTCheckout(document, src, libName, config) {
  return new Promise((resolve) => {
    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    var firstScriptElement = document.getElementsByTagName("script")[0];
    script.onload = function () {
      for (var namespace in config) {
        if (config.hasOwnProperty(namespace)) {
          window[libName].setup.setConfig(namespace, config[namespace]);
        }
      }
      window[libName].register();
      resolve();
    };

    firstScriptElement.parentNode.insertBefore(script, firstScriptElement);
  });
}

async function upgrade(user) {
  if (!("TwoCoInlineCart" in window)) {
    await loadTCheckout(
      document,
      "https://secure.avangate.com/checkout/client/twoCoInlineCart.js",
      "TwoCoInlineCart",
      {
        app: { merchant: "250327951921", iframeLoad: "checkout" },
        cart: {
          host: "https://secure.2checkout.com",
          customization: "inline",
        },
      }
    );
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
