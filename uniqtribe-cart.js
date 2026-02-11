if (location.pathname === "/cart") {
  location.replace("/my-cart");
}


 if (location.pathname === "/checkout") {

  function applyMakePaymentOnlyView() {
    const reviewContainer = document.getElementById("zs-checkout-review-order");
    if (!reviewContainer) return;

    /* 1️⃣ Rename all titles */
    document.querySelectorAll(
      '.theme-checkout-steps a[data-zs-checkout-nav-order-review], \
       .theme-checkout-steps a.active, \
       #zs-checkout-review-order h4.theme-checkout-details-title'
    ).forEach(el => {
      if (el.textContent.includes("Review")) {
        el.textContent = "Make Payment";
      }
    });

    /* 2️⃣ Hide EVERYTHING except Make Payment button */
    reviewContainer.querySelectorAll(`
      .order-review,
      .theme-cart-view-wrap,
      [review_order_before_section],
      [review_order_after_section],
      [payment_option_section],
      [payment_method_section],
      [review_order_afterend_section],
      [review_order_bottom_section],
      .theme-order-review-address-area
    `).forEach(el => {
      el.style.display = "none";
    });

    /* 3️⃣ Ensure button container stays visible */
    const btnWrap = reviewContainer.querySelector(".theme-continue-btn");
    if (btnWrap) btnWrap.style.display = "block";
  }

  /* Zoho renders late → retry until found */
  let tries = 0;
  const timer = setInterval(() => {
    applyMakePaymentOnlyView();
    tries++;
    if (tries > 15) clearInterval(timer);
  }, 300);

 }
