/* As Seen On hub: category filters, Load more, live counts.
   Page 1 (up to 50 articles) is server-rendered; extra pages are fetched in the background
   so counts and filters cover every sighting. */
(function () {
  var hub = document.querySelector('[data-asn-hub]');
  if (!hub) return;

  var grid = hub.querySelector('[data-asn-grid]');
  var moreBtn = hub.querySelector('[data-asn-more]');
  var empty = hub.querySelector('[data-asn-empty]');
  var note = hub.querySelector('[data-asn-note]');
  var totalEl = hub.querySelector('[data-asn-total]');
  var chips = Array.prototype.slice.call(hub.querySelectorAll('.asn-chip'));

  var initial = parseInt(hub.dataset.initial, 10) || 8;
  var step = parseInt(hub.dataset.step, 10) || 30;
  var pages = parseInt(hub.dataset.pages, 10) || 1;
  var base = hub.dataset.base || window.location.pathname;
  var loadLabel = hub.dataset.loadLabel || 'Load {n} more';
  var noteTpl = hub.dataset.note || '{shown} of {total} shown';
  var countTpl = hub.dataset.countLabel || '{total} sightings';

  var filter = 'all';
  var shown = initial;

  function cards() { return Array.prototype.slice.call(grid.querySelectorAll('.asn-card')); }
  function matching() {
    return cards().filter(function (c) { return filter === 'all' || c.dataset.category === filter; });
  }

  function updateCounts() {
    var all = cards();
    var counts = {};
    all.forEach(function (c) { counts[c.dataset.category] = (counts[c.dataset.category] || 0) + 1; });
    chips.forEach(function (chip) {
      var el = chip.querySelector('[data-count-for]');
      if (!el) return;
      el.textContent = chip.dataset.filter === 'all' ? all.length : (counts[chip.dataset.filter] || 0);
    });
    if (totalEl) totalEl.textContent = countTpl.replace('{total}', all.length);
  }

  function render() {
    var list = matching();
    cards().forEach(function (c) { c.hidden = true; });
    list.forEach(function (c, i) { c.hidden = i >= shown; });
    var visible = Math.min(shown, list.length);
    var remaining = list.length - visible;
    if (empty) empty.hidden = list.length > 0;
    if (moreBtn) {
      moreBtn.hidden = remaining <= 0;
      moreBtn.textContent = loadLabel.replace('{n}', Math.min(step, Math.max(remaining, 0)));
    }
    if (note) {
      note.hidden = list.length === 0;
      note.textContent = noteTpl.replace('{shown}', visible).replace('{total}', list.length);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filter = chip.dataset.filter;
      shown = initial;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  if (moreBtn) moreBtn.addEventListener('click', function () { shown += step; render(); });

  // Fetch pages 2..n so counts/filters cover everything
  function loadRest() {
    var seen = {};
    cards().forEach(function (c) { seen[c.dataset.id] = true; });
    var jobs = [];
    for (var p = 2; p <= pages; p++) {
      jobs.push(
        fetch(base + '?page=' + p, { credentials: 'same-origin' })
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            doc.querySelectorAll('[data-asn-grid] .asn-card').forEach(function (c) {
              if (seen[c.dataset.id]) return;
              seen[c.dataset.id] = true;
              c.hidden = true;
              grid.appendChild(document.importNode(c, true));
            });
          })
          .catch(function () { /* keep what we have */ })
      );
    }
    return Promise.all(jobs);
  }

  updateCounts();
  render();
  if (pages > 1) loadRest().then(function () { updateCounts(); render(); });
})();
