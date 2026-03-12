/* Safe Gift Wrap + Personal Message controls (full script)
   - Defensive: try/catch, null guards, delegated listeners
   - Immediate visual update while typing + debounced server save
   - Auto-remove gift wrap when cart becomes empty
*/
(function () {
  try {
    const GIFT_HANDLE = 'gift-wrap';

    // --- safe query helpers ---
    const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

    // ---------- Cart helpers ----------
    async function getCart() {
      try {
        const res = await fetch('/cart.js', { credentials: 'same-origin' });
        return res.ok ? await res.json() : { items: [] };
      } catch (err) {
        console.warn('getCart failed', err);
        return { items: [] };
      }
    }

    async function addGiftWrap(variantId) {
      try {
        const idNum = Number(variantId);
        if (!idNum) return;
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id: idNum, quantity: 1, properties: { _GiftWrap: 'Cart-level' } })
        });
      } catch (err) {
        console.error('addGiftWrap failed', err);
        throw err;
      }
    }

    async function removeGiftWrapByHandle(handle = GIFT_HANDLE) {
      try {
        const cart = await getCart();
        const idx = cart.items.findIndex(i => i.handle === handle);
        if (idx === -1) return;
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ line: idx + 1, quantity: 0 })
        });
      } catch (err) {
        console.error('removeGiftWrapByHandle failed', err);
        throw err;
      }
    }

    async function updateGiftMessageOnServer(value = '') {
      try {
        await fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ attributes: { 'Gift message': value } })
        });
        return true;
      } catch (err) {
        console.error('updateGiftMessageOnServer failed', err);
        return false;
      }
    }

    // ---------- UI helpers ----------
    function setButtonAdded(btn) {
      if (!btn) return;
      btn.classList.add('added');
      // small trusted HTML fragment
      btn.innerHTML = 'ADDED <span class="checkmark">✓</span>';
      btn.setAttribute('aria-pressed', 'true');
    }
    function setButtonAdd(btn) {
      if (!btn) return;
      btn.classList.remove('added');
      btn.textContent = 'ADD';
      btn.setAttribute('aria-pressed', 'false');
    }
    function setButtonEdit(btn) {
      if (!btn) return;
      btn.classList.remove('added');
      btn.textContent = 'EDIT';
      btn.setAttribute('aria-pressed', 'false');
    }

    // ---------- Sync UI from DOM / initial state ----------
    function syncUIWithCart() {
      try {
        // Gift wrap buttons
        $$('.js-toggle-gift-wrap').forEach(btn => {
          // prefer explicit class/data state; fall back to data-has-gift or attribute
          const hasAdded = btn.classList.contains('added') || btn.getAttribute('data-has-gift') === 'true';
          if (hasAdded) setButtonAdded(btn);
          else setButtonAdd(btn);
        });

        // Message button(s) & textarea
        const textarea = document.getElementById('gift-message-input');
        const msgVal = textarea ? (textarea.value || '').trim() : '';
        $$('.js-toggle-message').forEach(btn => {
          const visibleAttr = btn.getAttribute('data-visible');
          const isVisible = visibleAttr === 'true' || visibleAttr === '1';
          const hasMsg = msgVal.length > 0 || isVisible;
          if (hasMsg) setButtonAdded(btn);
          else {
            // default text: if visible then EDIT, otherwise ADD
            btn.classList.remove('added');
            btn.textContent = isVisible ? 'EDIT' : 'ADD';
          }
        });
      } catch (err) {
        console.warn('syncUIWithCart error', err);
      }
    }

    // ---------- Debounced server save (with immediate visual update) ----------
    let msgSaveTimer = null;
    function saveGiftMessageDebounced(value) {
      const status = $('.gift-message-save-status');
      if (status) { status.style.display = 'inline'; status.textContent = 'Saving…'; }
      if (msgSaveTimer) clearTimeout(msgSaveTimer);
      msgSaveTimer = setTimeout(async () => {
        const ok = await updateGiftMessageOnServer(value);
        if (ok) {
          if (status) {
            status.textContent = 'Saved';
            setTimeout(() => { status.style.display = 'none'; }, 900);
          }
        } else {
          if (status) {
            status.textContent = 'Error';
            setTimeout(() => { status.style.display = 'none'; }, 1400);
          }
        }
        // ensure UI remains in sync after save
        syncUIWithCart();
      }, 450);
    }

    // ---------- Enforcement: auto-remove gift wrap when cart empty ----------
    let enforceTimer = null;
    function scheduleEnforce(delay = 300) {
      if (enforceTimer) clearTimeout(enforceTimer);
      enforceTimer = setTimeout(async () => {
        try {
          const cart = await getCart();
          const hasGift = cart.items.some(i => i.handle === GIFT_HANDLE);
          const nonGiftCount = cart.items.filter(i => i.handle !== GIFT_HANDLE).length;
          if (hasGift && nonGiftCount === 0) {
            await removeGiftWrapByHandle(GIFT_HANDLE);
            await updateGiftMessageOnServer('');
            syncUIWithCart();
          }
        } catch (err) {
          console.warn('enforceGiftWrapRule failed', err);
        }
      }, delay);
    }

    // ---------- Delegated event handlers (click + input) ----------
    document.addEventListener('click', async function (e) {
      try {
        const target = e.target;
        if (!target) return;

        // Gift wrap toggle (click on button or children inside)
        const giftBtn = target.closest && target.closest('.js-toggle-gift-wrap');
        if (giftBtn) {
          e.preventDefault();
          giftBtn.disabled = true;
          const adding = !giftBtn.classList.contains('added');
          try {
            if (adding) {
              setButtonAdded(giftBtn);
              await addGiftWrap(giftBtn.dataset.variantId);
            } else {
              setButtonAdd(giftBtn);
              await removeGiftWrapByHandle(giftBtn.dataset.handle || GIFT_HANDLE);
            }
          } catch (err) {
            console.error('gift toggle failed', err);
            alert('Sorry, we could not update gift wrap. Please try again.');
          } finally {
            giftBtn.disabled = false;
            scheduleEnforce();
          }
          return;
        }

        // Message toggle (open/close drawer)
        const msgBtn = target.closest && target.closest('.js-toggle-message');
        if (msgBtn) {
          e.preventDefault();
          const drawer = document.querySelector('.gift-message-drawer');
          if (!drawer) return;
          const willBeVisible = drawer.style.display !== 'block';
          drawer.style.display = willBeVisible ? 'block' : 'none';
          // toggle parent active class safely
          const parent = msgBtn.closest('.gift-option-row');
          if (parent) parent.classList.toggle('active', willBeVisible);

          // Button text: when we open show EDIT; when we close show ADD if no message, or EDIT if message exists
          if (willBeVisible) {
            msgBtn.textContent = 'EDIT';
          } else {
            // determine whether saved message exists (use textarea)
            const textarea = document.getElementById('gift-message-input');
            const hasMsg = textarea && (textarea.value || '').trim().length > 0;
            if (hasMsg) setButtonAdded(msgBtn);
            else setButtonAdd(msgBtn);
          }
          return;
        }
      } catch (err) {
        console.warn('delegated click handler error', err);
      }
    });

    // Input handler: IMMEDIATE visual update + debounced save
    document.addEventListener('input', function (e) {
      try {
        const t = e.target;
        if (t && t.id === 'gift-message-input') {
          const trimmed = (t.value || '').trim();

          // Immediate visual update for all message buttons
          $$('.js-toggle-message').forEach(btn => {
            if (trimmed.length > 0) setButtonAdded(btn);
            else setButtonAdd(btn);
          });

          // Debounced save keeps server in sync
          saveGiftMessageDebounced(t.value);
        }
      } catch (err) {
        console.warn('input handler failed', err);
      }
    });

    // ---------- Initial sync ----------
    // Run on DOMContentLoaded or immediately if ready
    function initOnce() {
      try {
        syncUIWithCart();
        scheduleEnforce(100);
      } catch (err) {
        console.warn('initial sync failed', err);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initOnce);
    } else {
      initOnce();
    }

    // ---------- Light MutationObserver: watch for cart drawer changes (throttled) ----------
    let obsTimer = null;
    const observer = new MutationObserver(() => {
      if (obsTimer) clearTimeout(obsTimer);
      obsTimer = setTimeout(() => {
        try {
          const root = document.querySelector('[data-cart-drawer]');
          if (root) {
            // DOM changed; re-sync UI to reflect current elements/state
            syncUIWithCart();
          }
          scheduleEnforce(300);
        } catch (err) {
          console.warn('mutation observer callback error', err);
        }
      }, 250);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // ---------- Debug helper (optional) ----------
    window.__giftWrapDebug = function () {
      console.log('giftWrap debug: giftBtns', $$('.js-toggle-gift-wrap'), 'msgBtns', $$('.js-toggle-message'));
      console.log('textarea value:', document.getElementById('gift-message-input')?.value);
      syncUIWithCart();
    };

  } catch (startupErr) {
    // fail safe: log but don't rethrow to avoid breaking page
    console.error('Gift wrap script failed to initialize', startupErr);
  }
})();
