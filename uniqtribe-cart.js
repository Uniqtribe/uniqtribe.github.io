if (location.pathname === "/cart") {
  location.replace("/my-cart");
}


 if (location.pathname === "/checkout") {
 function isolateMakePaymentButton() {
    const review = document.getElementById("zs-checkout-review-order");
    if (!review) return;

    const buttonWrap = review.querySelector(".theme-continue-btn");
    if (!buttonWrap) return;

    // 1️⃣ Rename text everywhere
    document.querySelectorAll(
      '.theme-checkout-steps a[data-zs-checkout-nav-order-review], \
       .theme-checkout-steps a.active, \
       #zs-checkout-review-order h4.theme-checkout-details-title'
    ).forEach(el => {
      if (el.textContent.includes("Review")) {
        el.textContent = "Make Payment";
      }
    });

    // 2️⃣ Move button OUTSIDE review container (only once)
    if (!document.getElementById("make-payment-floating")) {
      const wrapper = document.createElement("div");
      wrapper.id = "make-payment-floating";
      wrapper.appendChild(buttonWrap);
      review.parentElement.insertBefore(wrapper, review);
    }

    // 3️⃣ Hide entire review section
    review.style.display = "none";
  }

  // Zoho renders async → retry
  let attempts = 0;
  const interval = setInterval(() => {
    isolateMakePaymentButton();
    attempts++;
    if (attempts > 15) clearInterval(interval);
  }, 300);
 }
