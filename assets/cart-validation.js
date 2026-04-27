// Cart Validation Script for Brown Sugar Bakery
// This detects when shipping and pickup products are mixed in the cart

document.addEventListener('DOMContentLoaded', function() {
  // Add validation when cart page loads
  validateCart();
  
  // Also validate when cart changes
  document.addEventListener('cart:updated', validateCart);
});

function validateCart() {
  // Fetch the current cart data
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      let hasShippingProduct = false;
      let hasPickupProduct = false;
      let conflictDetected = false;
      
      // Check each item in the cart
      // We'll use product tags or metafields to identify shipping vs pickup items
      cart.items.forEach(item => {
        // You'll need to adjust this logic based on how you've tagged your products
        // Option 1: Using product tags (examples)
        if (item.tags && item.tags.includes('shipping-only')) {
          hasShippingProduct = true;
        }
        if (item.tags && item.tags.includes('pickup-only')) {
          hasPickupProduct = true;
        }
        
        // Option 2: Using product type
        if (item.product_type === 'Shipping') {
          hasShippingProduct = true;
        }
        if (item.product_type === 'Pickup') {
          hasPickupProduct = true;
        }
        
        // Option 3: Using collections or metafields
        // You may need to use additional API calls to determine this
      });
      
      // If both types are detected, show warning
      if (hasShippingProduct && hasPickupProduct) {
        showConflictMessage();
        disableCheckout();
        conflictDetected = true;
      } else {
        hideConflictMessage();
        enableCheckout();
      }
      
      return conflictDetected;
    })
    .catch(error => {
      console.error('Error validating cart:', error);
    });
}

function showConflictMessage() {
  // Check if message already exists
  if (!document.getElementById('cart-conflict-message')) {
    // Create warning message
    const messageDiv = document.createElement('div');
    messageDiv.id = 'cart-conflict-message';
    messageDiv.className = 'cart-conflict-warning';
    messageDiv.innerHTML = `
      <div class="notification notification--error" role="status">
        <svg aria-hidden="true" focusable="false" class="icon icon-error">
          <use href="#icon-error"></use>
        </svg>
        <div>
          <h2>Delivery Method Conflict</h2>
          <p>We noticed your cart contains both shipping and in-store pickup items. These cannot be ordered together. Please remove either the shipping or pickup items to continue.</p>
        </div>
      </div>
    `;
    
    // Add message to the page (adjust the selector based on your theme)
    const cartForm = document.querySelector('form[action="/cart"]');
    if (cartForm) {
      cartForm.prepend(messageDiv);
    } else {
      // Fallback if the form selector doesn't match
      const cartEl = document.querySelector('.cart');
      if (cartEl) {
        cartEl.prepend(messageDiv);
      }
    }
  }
}

function hideConflictMessage() {
  const messageDiv = document.getElementById('cart-conflict-message');
  if (messageDiv) {
    messageDiv.remove();
  }
}

function disableCheckout() {
  // Disable all checkout buttons
  const checkoutButtons = document.querySelectorAll('button[name="checkout"], input[name="checkout"]');
  checkoutButtons.forEach(button => {
    button.disabled = true;
    button.classList.add('btn--disabled');
    
    // Add a data attribute to remember it was disabled by our script
    button.setAttribute('data-disabled-by-validation', 'true');
  });
}

function enableCheckout() {
  // Re-enable only buttons that were disabled by our script
  const checkoutButtons = document.querySelectorAll('[data-disabled-by-validation="true"]');
  checkoutButtons.forEach(button => {
    button.disabled = false;
    button.classList.remove('btn--disabled');
    button.removeAttribute('data-disabled-by-validation');
  });
}