// ============================================
// Script 1: Currency/Country Selector
// ============================================
(function () {
  var submitting = false;
  function lock() { submitting = true; setTimeout(function(){ submitting = false; }, 1200); }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-disclosure-toggle]');
    if (!toggle) return;
    var disclosure = toggle.closest('[data-disclosure-currency]');
    if (!disclosure) return;
    e.preventDefault();
    document.querySelectorAll('[data-disclosure-currency] [data-disclosure-toggle][aria-expanded="true"]').forEach(function(btn){
      if (btn !== toggle) btn.setAttribute('aria-expanded', 'false');
    });
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    var list = disclosure.querySelector('[data-disclosure-list]');
    if (list) list.classList.toggle('is-open', !expanded);
  });

  document.addEventListener('click', function (e) {
    var option = e.target.closest('[data-disclosure-option]');
    if (!option) return;
    var disclosure = option.closest('[data-disclosure-currency]');
    if (!disclosure) return;
    var form = option.closest('form') || disclosure.closest('form');
    if (!form) return;
    e.preventDefault();
    var value = option.getAttribute('data-value');
    var input = form.querySelector('[data-disclosure-input]') ||
                form.querySelector('input[name="country_code"]') ||
                form.querySelector('input[name="currency_code"]');
    if (!input) return;
    input.value = value;
    var clickedLabel = option.querySelector('.disclosure-list__label');
    var buttonLabel = disclosure.querySelector('.faux-select .disclosure-list__label');
    if (buttonLabel && clickedLabel) buttonLabel.textContent = clickedLabel.textContent.trim();
    var toggle = disclosure.querySelector('[data-disclosure-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    var list = disclosure.querySelector('[data-disclosure-list]');
    if (list) list.classList.remove('is-open');
    if (!submitting) { lock(); form.submit(); }
  });

  document.addEventListener('click', function (e) {
    var openToggle = document.querySelector('[data-disclosure-currency] [data-disclosure-toggle][aria-expanded="true"]');
    if (!openToggle) return;
    var openDisclosure = openToggle.closest('[data-disclosure-currency]');
    if (!openDisclosure) return;
    if (!openDisclosure.contains(e.target)) {
      openToggle.setAttribute('aria-expanded', 'false');
      var list = openDisclosure.querySelector('[data-disclosure-list]');
      if (list) list.classList.remove('is-open');
    }
  });

  document.addEventListener('shopify:section:load', function(){});
})();


// ============================================
// Script 2: Klaviyo Popup (non-product pages)
// ============================================
(function() {
  if (
    window.location.pathname.includes("/products/") ||
    window.location.pathname.includes("newsletter-signup")
  ) return;

  let fired = false;

  function checkKlaviyoIdentity(timeout, interval) {
    timeout = timeout || 3000;
    interval = interval || 100;
    return new Promise(function(resolve) {
      var start = Date.now();
      (function poll() {
        if (typeof klaviyo !== "undefined" && typeof klaviyo.isIdentified === "function") {
          resolve(klaviyo.isIdentified());
        } else if (Date.now() - start >= timeout) {
          resolve(false);
        } else {
          setTimeout(poll, interval);
        }
      })();
    });
  }

  checkKlaviyoIdentity().then(function(isIdentified) {
    if (isIdentified) return;

    function triggerAction() {
      if (fired) return;
      fired = true;
      if (typeof Shopify !== "undefined" && Shopify.locale) {
        if (Shopify.locale === "en") {
          window._klOnsite = window._klOnsite || [];
          window._klOnsite.push(['openForm', 'T56xG4']);
        } else if (Shopify.locale === "it") {
          window._klOnsite = window._klOnsite || [];
          window._klOnsite.push(['openForm', 'VzrGey']);
        }
      }
    }

    setTimeout(triggerAction, 20000);

    function onScroll() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrolled = (scrollTop / docHeight) * 100;
      if (scrolled >= 30) {
        triggerAction();
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll);
  });
})();

document.addEventListener('variant:change', (event) => {
  const { variant } = event.detail;
  if (!variant) {
    console.log('Invalid combination — no matching variant');
    return;
  }
  const inventory_status = document.querySelector('.product-single__meta .pdp_inventory_label');
  const sticky_inventory_status = document.querySelectorAll('#md-sticky-atc .pdp_inventory_label');
  if(variant.inventory_quantity > 0 && inventory_status){
    inventory_status.classList.remove('pdp_inventory_soldout');
    sticky_inventory_status.forEach((item) => {
      item.classList.remove('pdp_inventory_soldout');
    });
  }
  else if(inventory_status){
    inventory_status.classList.add('pdp_inventory_soldout');
    sticky_inventory_status.forEach((item) => {
      item.classList.add('pdp_inventory_soldout');
    });
  }
});

document.addEventListener('click', (e) => {
  const productImage = e.target.closest('[data-product-image-main]');
  const remove_cart_item = e.target.closest('.remove_cart_item');

  if(productImage){
    if (window.innerWidth > 767) return;

    // Prevent when actual zoom button itself is clicked
    if (e.target.closest('.product__photo-zoom')) return;

    const zoomBtn = productImage.querySelector('.product__photo-zoom');
    zoomBtn?.click();
  }

  if (remove_cart_item) {
    const key = remove_cart_item.getAttribute('item-key');
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: key,
        quantity: 0
      })
    })
    .then(response => response.json())
    .then(cart => {
      console.log('Item removed', cart);
      document.dispatchEvent(new CustomEvent('ajaxProduct:added'));
    })
    .catch(error => {
      console.error(error);
    });
  }

});

// ============================================
// Script 3: Klaviyo Popup (Automatically discount)
// ============================================

window.addEventListener('klaviyoForms', function (event) {
    if (
      !window.klaviyo_discount.auto_discount ||
      event.detail.type !== 'submit' ||
      event.detail.formId !== window.klaviyo_discount.form_id
    ) {
      return;
    }

    fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discount: window.klaviyo_discount.discount_code
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to apply discount');
        }

        return response.json();
      })
      .then(function (cart) {
        console.log('Discount applied:', cart);
      })
      .catch(function (error) {
        console.error('Discount application failed:', error);
      });
});