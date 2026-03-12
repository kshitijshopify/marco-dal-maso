  /* hero carousel home custom — uses theme-provided Flickity (no CDN load) */
(function () {
  var selector = '.js-hero-carousel-custom';
  var mobileMq = '(max-width:767px)';
  var minSliderHeight = 200; // px
  var _debug = false; // set true while debugging on mobile

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 80);
    };
  }

  function patchFlickityProto() {
    if (!window.Flickity || window.Flickity.__patched__) return;
    var proto = window.Flickity.prototype;
    var _origReposition = proto.reposition;
    var _origResize = proto.resize;
    proto.reposition = debounce(function () {
      try { _origReposition.apply(this, arguments); } catch (e) { console.warn(e); }
    }, 90);
    proto.resize = debounce(function () {
      try { _origResize.apply(this, arguments); } catch (e) { console.warn(e); }
    }, 120);
    window.Flickity.__patched__ = true;
  }

  function findSliderEl() {
    var el = document.querySelector(selector);
    if (el) {
      var s = el.closest('section.hero-slider') || el.closest('section[id^="hero-slider-"]') || el.closest('section');
      return s || el;
    }
    return document.querySelector('.hero-slider') || null;
  }

  function setSliderHeight() {
    try {
      var header = document.querySelector('header') || document.querySelector('.site-header') || document.querySelector('.header') || null;
      var headerHeight = header ? header.offsetHeight : 0;
      var available = Math.max(window.innerHeight - headerHeight - 100, minSliderHeight);
      document.documentElement.style.setProperty('--slider-height', available + 'px');

      var sliderContainer = findSliderEl();
      if (sliderContainer && sliderContainer.style) {
        sliderContainer.style.setProperty('--slider-height', available + 'px');
      } else if (_debug) {
        console.warn('setSliderHeight: slider container not found');
      }
    } catch (err) {
      console.warn('setSliderHeight error', err);
    }
  }

  function ensureVideoLoaded(videoEl) {
    if (!videoEl) return;
    if (videoEl.dataset.loaded === '1') return;
    var srcEl = videoEl.querySelector('source[data-src]');
    if (srcEl && srcEl.dataset && srcEl.dataset.src) {
      srcEl.src = srcEl.dataset.src;
      srcEl.removeAttribute('data-src');
      try { videoEl.load(); } catch (e) {}
      videoEl.addEventListener('loadedmetadata', function onMeta() {
        videoEl.dataset.loaded = '1';
        videoEl.removeEventListener('loadedmetadata', onMeta);
      }, { once: true });
    } else {
      if (videoEl.querySelector('source') && videoEl.querySelector('source').src) {
        videoEl.dataset.loaded = '1';
      }
    }
  }

  function tryPlay(videoEl) {
    if (!videoEl) return;
    videoEl.muted = true;
    var p = videoEl.play();
    if (p && typeof p.then === 'function') p.catch(function () { /* autoplay blocked */ });
  }

  function pauseVideo(videoEl) {
    if (!videoEl) return;
    try { videoEl.pause(); } catch (e) { }
  }

  function pauseAllMobileVideos() {
    var list = document.querySelectorAll(selector + ' .mobile-video');
    list.forEach(function (v) { pauseVideo(v); });
  }

  function activateIndex(flkty) {
    if (!flkty) return;
    if (!window.matchMedia(mobileMq).matches) return;
    var cells = flkty.getCellElements();
    var total = cells.length;
    if (!total) return;
    var idx = flkty.selectedIndex || 0;
    var prev = (idx - 1 + total) % total;
    var next = (idx + 1) % total;

    pauseAllMobileVideos();

    [prev, idx, next].forEach(function (i) {
      var cell = cells[i];
      if (!cell) return;
      var v = cell.querySelector('.mobile-video');
      if (v) ensureVideoLoaded(v);
    });

    var current = cells[idx];
    if (current) {
      var curVideo = current.querySelector('.mobile-video');
      if (curVideo) {
        setTimeout(function () {
          tryPlay(curVideo);
          setTimeout(function () { try { flkty.reposition(); flkty.resize(); } catch (e) {} }, 60);
        }, 80);
      }
    }
  }

  function warmNeighbors(flkty) {
    if (!flkty) return;
    if (!window.matchMedia(mobileMq).matches) return;
    var cells = flkty.getCellElements();
    var total = cells.length;
    if (!total) return;
    var idx = flkty.selectedIndex || 0;
    var prev = (idx - 1 + total) % total;
    var next = (idx + 1) % total;
    [prev, next].forEach(function (i) {
      var v = (cells[i] && cells[i].querySelector('.mobile-video'));
      if (v) ensureVideoLoaded(v);
    });
  }

  function initSlider() {
    var carousel = document.querySelector(selector);
    if (!carousel) {
      if (_debug) console.warn('initSlider: carousel not found for selector', selector);
      return null;
    }
    if (carousel._flickityInstance) return carousel._flickityInstance;

    // If Flickity isn't available, warn and exit gracefully
    if (!window.Flickity) {
      console.warn('Flickity not found — slider not initialized. Theme should include Flickity.');
      return null;
    }

    var flkty = new Flickity(carousel, {
      cellAlign: 'center',
      contain: true,
      wrapAround: true,
      prevNextButtons: false,
      pageDots: true,
      imagesLoaded: true, // if your theme doesn't include imagesLoaded plugin, set this to false
      adaptiveHeight: false,
      draggable: true
    });

    carousel._flickityInstance = flkty;

    flkty.on('ready', function () {
      setSliderHeight();
      if (window.matchMedia(mobileMq).matches) activateIndex(flkty);
    });

    flkty.on('select', function () {
      if (window.matchMedia(mobileMq).matches) activateIndex(flkty);
    });

    flkty.on('dragStart', function () { warmNeighbors(flkty); });

    return flkty;
  }

  function handleViewportChange(flkty) {
    if (!flkty) flkty = document.querySelector(selector) && Flickity.data(document.querySelector(selector));
    if (!flkty) return;
    if (window.matchMedia(mobileMq).matches) {
      activateIndex(flkty);
    } else {
      var vids = document.querySelectorAll(selector + ' .mobile-video');
      vids.forEach(function (v) {
        try { v.pause(); } catch (e) { }
        var s = v.querySelector('source');
        if (s && s.src) {
          s.removeAttribute('src');
          try { v.load(); } catch (e) { }
          delete v.dataset.loaded;
        }
      });
      try { flkty.reposition(); flkty.resize(); } catch (e) { }
    }
  }

  function addMouseThrottle() {
    try {
      var root = findSliderEl() || document;
      var last = 0;
      var throttleMs = 60;
      function cap(e) {
        var now = Date.now();
        if (now - last < throttleMs) {
          e.stopImmediatePropagation();
        } else { last = now; }
      }
      root.addEventListener('mousemove', cap, { capture: true, passive: true });
      root.addEventListener('mouseenter', cap, { capture: true, passive: true });
    } catch (e) { /* non-fatal */ }
  }

  // Kick off initialization — rely on theme-provided Flickity
  try {
    patchFlickityProto();
    setSliderHeight();
    var flkty = initSlider();

    handleViewportChange(flkty);

    var mqList = window.matchMedia(mobileMq);
    if (mqList.addEventListener) mqList.addEventListener('change', function () { handleViewportChange(flkty); });
    else if (mqList.addListener) mqList.addListener(function () { handleViewportChange(flkty); });

    window.addEventListener('resize', debounce(function () { setSliderHeight(); if (flkty) { flkty.resize(); flkty.reposition(); } }, 120));
    window.addEventListener('load', function () { setTimeout(function () { setSliderHeight(); if (flkty) activateIndex(flkty); }, 60); });

    document.addEventListener('shopify:section:load', function() { setTimeout(function(){ initSlider(); setSliderHeight(); }, 60); });
    document.addEventListener('shopify:section:reorder', function() { if (flkty) flkty.reloadCells(); });

    addMouseThrottle();
    if (_debug) console.log('Hero carousel init (theme Flickity)');
  } catch (e) {
    console.error('Hero carousel init error', e);
  }
})();