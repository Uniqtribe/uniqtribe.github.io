/* CART REDIRECT */
if (location.pathname === "/cart") {
  location.replace("/my-cart");
}


/* CHECKOUT CUSTOMIZATION */
(function () {
  if (!location.pathname.includes("checkout")) return;

  function hideReviewOrder() {
    const review = document.getElementById("zs-checkout-review-order");
    if (!review) return;

    // Move Make Payment button out (only once)
    const buttonWrap = review.querySelector(".theme-continue-btn");
    if (buttonWrap && !document.getElementById("make-payment-isolated")) {
      const holder = document.createElement("div");
      holder.id = "make-payment-isolated";
      holder.appendChild(buttonWrap);
      review.parentNode.insertBefore(holder, review);
    }

    // Force hide review section
    review.style.setProperty("display", "none", "important");
  }

  hideReviewOrder();

  const observer = new MutationObserver(() => {
    hideReviewOrder();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
