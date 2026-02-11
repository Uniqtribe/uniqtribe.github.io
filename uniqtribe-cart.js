/* CART REDIRECT */
if (location.pathname === "/cart") {
  location.replace("/my-cart");
}


/* CHECKOUT CUSTOMIZATION */
(function () {
  if (!location.pathname.includes("checkout")) return;

  function renameToMakePayment() {
    document.querySelectorAll(`
      a[data-zs-checkout-nav-order-review],
      .theme-checkout-steps a.active,
      #zs-checkout-review-order h4.theme-checkout-details-title
    `).forEach(el => {
      if (el.textContent && el.textContent.toLowerCase().includes("review")) {
        el.textContent = "Make Payment";
      }
    });
  }
function fixDuplicateMakePaymentButtons() {
  const isMobile = window.innerWidth <= 768;

  const isolated = document.getElementById("make-payment-isolated");
  const mobileBtn = document.getElementById("zs-mobile-make-payment-button");

  if (isMobile) {
    if (isolated) isolated.style.display = "none";
    if (mobileBtn) mobileBtn.style.display = "inline-flex";
  } else {
    if (isolated) isolated.style.display = "block";
    if (mobileBtn) mobileBtn.style.display = "none";
  }
}
  function hideReviewOrder() {
    const review = document.getElementById("zs-checkout-review-order");
    if (!review) return;

    // Move Make Payment button OUT (only once)
    const buttonWrap = review.querySelector(".theme-continue-btn");
    if (buttonWrap && !document.getElementById("make-payment-isolated")) {
      const holder = document.createElement("div");
      holder.id = "make-payment-isolated";
      holder.appendChild(buttonWrap);
      review.parentNode.insertBefore(holder, review);
    }

    // Hide entire review section
    review.style.setProperty("display", "none", "important");
  }

  function fixActiveBarWidth() {
  document.querySelectorAll('.theme-active-bar').forEach(bar => {
    bar.style.setProperty('width', '100px', 'important');
  });
}
  function applyAll() {
    renameToMakePayment();
    hideReviewOrder();
    fixActiveBarWidth();
    fixDuplicateMakePaymentButtons();
  }

  // Initial run
  applyAll();

  // Zoho re-renders → observe & reapply
  const observer = new MutationObserver(() => {
    applyAll();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
