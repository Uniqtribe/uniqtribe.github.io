    const cartItemElements = document.querySelectorAll('[data-cart-item]');
    if (cartItemElements) {
        cartItemElements.forEach(cartItem => {
            const liElements = document.querySelectorAll("li");
            liElements.forEach(li => {
                if (li.textContent.trim().startsWith("source:")) {
                    cartItem.querySelector('ul').style.display = 'none';
                    cartItem.querySelectorAll('.theme-cart-qty-inc-dec').forEach(item => {
                        item.disabled = true;
                    });
                    cartItem.querySelector('[data-zs-quantity]').disabled = true;
                }
            });

        })
    }
