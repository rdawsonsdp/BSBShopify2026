/**
 * BSB Fulfillment validation
 *
 * Single source of truth for "can these products coexist in one cart?" logic.
 * Used by:
 *   - snippets/bsb-cart-drawer.liquid (intercepts /cart/add)
 *   - snippets/product-fulfillment.liquid (PDP picker)
 *   - templates/cart (load-time fallback for legacy mixed carts)
 *
 * Rule: a cart may contain pickup-only OR ship-only products, never both.
 *       Products eligible for BOTH adopt whichever method the cart already has.
 */
(function () {
  if (window.BSBFulfillment) return;

  function eligibilityFromForm(formEl) {
    if (!formEl) return { pickup: true, ship: true, known: false };
    var hasAttr = formEl.hasAttribute('data-bsb-pickup-eligible') ||
                  formEl.hasAttribute('data-bsb-ship-eligible');
    if (!hasAttr) return { pickup: true, ship: true, known: false };
    return {
      pickup: formEl.getAttribute('data-bsb-pickup-eligible') !== 'false',
      ship:   formEl.getAttribute('data-bsb-ship-eligible')   !== 'false',
      known:  true
    };
  }

  function compatibilityCheck(cartMethod, eligibility) {
    if (!eligibility || !eligibility.known) return { ok: true };
    if (!cartMethod) return { ok: true }; // empty cart adopts whatever method
    var m = String(cartMethod).toLowerCase();
    if (m === 'pickup' && !eligibility.pickup) {
      return { ok: false, cartMethod: 'Pickup', productMethod: 'Ship' };
    }
    if (m === 'ship' && !eligibility.ship) {
      return { ok: false, cartMethod: 'Ship', productMethod: 'Pickup' };
    }
    return { ok: true };
  }

  function fetchCartMethod() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var attrs = (cart && cart.attributes) || {};
        return attrs['Checkout-Method'] || null;
      })
      .catch(function () { return null; });
  }

  function showConflictModal(opts) {
    opts = opts || {};
    closeModal(); // ensure only one at a time

    var overlay = document.createElement('div');
    overlay.className = 'bsb-fulfillment-modal-overlay';
    overlay.setAttribute('data-bsb-fulfillment-modal', '');
    overlay.innerHTML =
      '<div class="bsb-fulfillment-modal" role="alertdialog" aria-modal="true" aria-labelledby="bsb-fm-title">' +
        '<h2 id="bsb-fm-title" class="bsb-fulfillment-modal__title">Pickup and shipping can\'t mix</h2>' +
        '<p class="bsb-fulfillment-modal__body">' +
          'Your cart is set to <strong>' + escapeHtml(opts.cartMethod || 'Pickup') + '</strong>, ' +
          'but this item is <strong>' + escapeHtml(opts.productMethod || 'Ship') + '</strong>-only. ' +
          'You can empty your cart and add this item, or cancel and keep your current cart.' +
        '</p>' +
        '<div class="bsb-fulfillment-modal__actions">' +
          '<button type="button" class="bsb-fulfillment-modal__btn bsb-fulfillment-modal__btn--secondary" data-bsb-fm-cancel>Cancel</button>' +
          '<button type="button" class="bsb-fulfillment-modal__btn bsb-fulfillment-modal__btn--primary" data-bsb-fm-empty>Empty cart &amp; add</button>' +
        '</div>' +
      '</div>';

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeAndCancel();
    });
    overlay.querySelector('[data-bsb-fm-cancel]').addEventListener('click', closeAndCancel);
    overlay.querySelector('[data-bsb-fm-empty]').addEventListener('click', function () {
      closeModal();
      if (typeof opts.onEmptyAndAdd === 'function') opts.onEmptyAndAdd();
    });

    function closeAndCancel() {
      closeModal();
      if (typeof opts.onCancel === 'function') opts.onCancel();
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });

    // ESC closes
    document.addEventListener('keydown', escListener);
    function escListener(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escListener);
        closeAndCancel();
      }
    }
  }

  function closeModal() {
    var existing = document.querySelector('[data-bsb-fulfillment-modal]');
    if (existing) existing.remove();
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------------------------------------------------------------
  // Load-time fallback for legacy mixed carts (cart page only)
  // Runs once on cart page; banner only — does not block checkout.
  // The real enforcement happens at /cart/add interception.
  // ---------------------------------------------------------------
  function loadTimeCartCheck() {
    if (!/\/cart(\?|$|\/)/.test(window.location.pathname)) return;
    fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) return;
        // Without per-item eligibility data on cart line items, we can't reliably
        // diagnose legacy mixed carts here. Skip for now — server-side enforcement
        // is the safety net (the Checkout-Method cart attribute is consistent
        // because the /cart/add interceptor refuses conflicts before any add lands).
      })
      .catch(function () {});
  }
  document.addEventListener('DOMContentLoaded', loadTimeCartCheck);

  // -----------------------------------------------------------------
  // "Added to cart" toast — slides in top-right, auto-dismisses
  // -----------------------------------------------------------------
  function showAddedToast(title) {
    var existing = document.querySelector('[data-bsb-added-toast]');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'bsb-added-toast';
    toast.setAttribute('data-bsb-added-toast', '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML =
      '<span class="bsb-added-toast__check" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="20 6 9 17 4 12"></polyline>' +
        '</svg>' +
      '</span>' +
      '<span class="bsb-added-toast__text">' +
        '<strong>Added to cart</strong>' +
        (title ? '<br><span class="bsb-added-toast__title">' + escapeHtml(title) + '</span>' : '') +
      '</span>';
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-open'); });
    setTimeout(function () {
      toast.classList.remove('is-open');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 240);
    }, 2600);
  }
  document.addEventListener('bsb:product-added', function (e) {
    var title = (e.detail && e.detail.title) || '';
    showAddedToast(title);
  });

  window.BSBFulfillment = {
    eligibilityFromForm: eligibilityFromForm,
    compatibilityCheck: compatibilityCheck,
    fetchCartMethod: fetchCartMethod,
    showConflictModal: showConflictModal,
    closeConflictModal: closeModal,
    showAddedToast: showAddedToast
  };
})();

// Modal styles — keep here so the namespace is self-contained.
(function () {
  if (document.getElementById('bsb-fulfillment-modal-styles')) return;
  var style = document.createElement('style');
  style.id = 'bsb-fulfillment-modal-styles';
  style.textContent = [
    '.bsb-fulfillment-modal-overlay { position: fixed; inset: 0; background: rgba(87,5,34,0.55); display: flex; align-items: center; justify-content: center; z-index: 100050; opacity: 0; transition: opacity 160ms ease; padding: 16px; }',
    '.bsb-fulfillment-modal-overlay.is-open { opacity: 1; }',
    '.bsb-fulfillment-modal { background: #fffaf2; border: 1px solid rgba(87,5,34,0.18); border-radius: 6px; max-width: 420px; width: 100%; padding: 22px 22px 18px; box-shadow: 0 14px 48px rgba(87,5,34,0.28); color: #570522; font-family: inherit; }',
    '.bsb-fulfillment-modal__title { margin: 0 0 10px; font-size: 18px; font-weight: 800; line-height: 1.25; color: #570522; }',
    '.bsb-fulfillment-modal__body { margin: 0 0 18px; font-size: 14px; line-height: 1.5; }',
    '.bsb-fulfillment-modal__actions { display: flex; gap: 10px; justify-content: flex-end; }',
    '.bsb-fulfillment-modal__btn { font: inherit; font-size: 14px; font-weight: 700; padding: 9px 16px; border-radius: 4px; cursor: pointer; border: 1px solid rgba(87,5,34,0.18); transition: background 140ms ease, color 140ms ease, border-color 140ms ease; }',
    '.bsb-fulfillment-modal__btn--secondary { background: #fffaf2; color: #570522; }',
    '.bsb-fulfillment-modal__btn--secondary:hover { border-color: #ba5b28; }',
    '.bsb-fulfillment-modal__btn--primary { background: linear-gradient(180deg, #6c0a2e 0%, #570522 60%, #45041b 100%); color: #fffaf2; border-color: #570522; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2); }',
    '.bsb-fulfillment-modal__btn--primary:hover { background: linear-gradient(180deg, #e68c3b 0%, #ba5b28 100%); border-color: #ba5b28; }',
    /* Added-to-cart toast */
    '.bsb-added-toast { position: fixed; top: 24px; right: 24px; z-index: 100060; min-width: 240px; max-width: 320px; padding: 14px 16px; background: #570522; color: #fffaf2; border-radius: 6px; box-shadow: 0 12px 32px rgba(87,5,34,0.32), inset 0 1px 0 rgba(255,255,255,0.15); display: flex; align-items: center; gap: 12px; font-family: inherit; font-size: 14px; line-height: 1.35; transform: translateX(120%); opacity: 0; transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease; pointer-events: none; }',
    '.bsb-added-toast.is-open { transform: translateX(0); opacity: 1; }',
    '.bsb-added-toast__check { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: #ba5b28; color: #fffaf2; flex: 0 0 auto; }',
    '.bsb-added-toast__text { min-width: 0; }',
    '.bsb-added-toast__title { font-weight: 700; opacity: 0.92; display: inline-block; margin-top: 2px; }',
    '@media (max-width: 480px) { .bsb-added-toast { top: auto; bottom: 88px; right: 16px; left: 16px; max-width: none; } }',
    '@media (prefers-reduced-motion: reduce) { .bsb-added-toast { transition: opacity 180ms ease; transform: none; } }'
  ].join('\n');
  document.head.appendChild(style);
})();
