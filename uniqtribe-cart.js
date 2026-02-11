if (location.pathname === "/cart") {
  location.replace("/my-cart");
}


 if (location.pathname === "/checkout") {
  if (!location.pathname.includes("checkout")) return;

  function hideReviewOrder() {
    const review = document.getElementById("zs-checkout-review-order");
    if (!review) return;

    // Move Make Payment button out (once)
    const buttonWrap = review.querySelector(".theme-continue-btn");
    if (buttonWrap && !document.getElementById("make-payment-isolated")) {
      const holder = document.createElement("div");
      holder.id = "make-payment-isolated";
      holder.appendChild(buttonWrap);
      review.parentNode.insertBefore(holder, review);
    }

    // HARD hide
    review.style.setProperty("display", "none", "important");
  }

  // Initial attempt
  hideReviewOrder();

  // 🔥 Watch for Zoho re-render
  const observer = new MutationObserver(() => {
    hideReviewOrder();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
 }
