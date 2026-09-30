class SizeCharts extends HTMLElement {
  connectedCallback() {
    if (this.initialised) return;
    this.initialised = true;

    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    if (!this.tabs.length) return;

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.select(tab));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = this.tabs[(index + 1) % this.tabs.length];
        if (event.key === 'ArrowLeft') next = this.tabs[(index - 1 + this.tabs.length) % this.tabs.length];
        if (!next) return;
        event.preventDefault();
        this.select(next);
        next.focus();
      });
    });

    // Optional: a wrapper (e.g. the drawer) can request which tab opens first.
    // <div id="size-chart-content" data-active-tab="cuffs">  -> matches label or index
    const requested = this.closest('[data-active-tab]')?.dataset.activeTab;
    if (requested) this.selectBy(requested);
  }

  select(tab) {
    this.tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', selected ? 'true' : 'false');
      item.setAttribute('tabindex', selected ? '0' : '-1');
      const panel = this.querySelector('#' + CSS.escape(item.getAttribute('aria-controls')));
      if (panel) panel.hidden = !selected;
    });
  }

  /* Accepts a tab label ("Cuffs"), or a 1-based index ("2"). */
  selectBy(value) {
    const key = String(value).trim().toLowerCase();

    const byIndex = this.tabs[Number(key) - 1];
    if (/^\d+$/.test(key) && byIndex) return this.select(byIndex);

    const byLabel = this.tabs.find((tab) => tab.textContent.trim().toLowerCase() === key);
    if (byLabel) this.select(byLabel);
  }
}

if (!customElements.get('size-charts')) {
  customElements.define('size-charts', SizeCharts);
}