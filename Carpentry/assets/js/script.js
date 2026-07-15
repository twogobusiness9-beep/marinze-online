
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var navList = document.getElementById('nav-list');
  var navMore = document.getElementById('nav-more');
  var navOverflow = document.getElementById('nav-overflow');
  var navToggle = document.getElementById('nav-toggle');

  if (navList && navMore && navOverflow && navToggle) {
    var allItems = Array.prototype.slice.call(navList.children);

    var collapseOrder = allItems.slice().sort(function (a, b) {
      return (parseInt(b.dataset.priority, 10) || 99) - (parseInt(a.dataset.priority, 10) || 99);
    });

    function layout() {
      allItems.forEach(function (li) { navList.appendChild(li); });
      navOverflow.innerHTML = '';
      navMore.classList.add('measuring');

      var collapsed = [];
      var guard = 0;
      while (navList.scrollWidth > navList.clientWidth + 1 &&
             collapsed.length < collapseOrder.length && guard++ < 50) {
        var li = collapseOrder[collapsed.length];
        collapsed.push(li);
        navList.removeChild(li);
      }
      navMore.classList.remove('measuring');

      if (collapsed.length) {
        navMore.classList.add('has-items');
        allItems.filter(function (li) { return collapsed.indexOf(li) !== -1; })
          .forEach(function (li) {
            var nli = document.createElement('li');
            nli.appendChild(li.querySelector('a').cloneNode(true));
            navOverflow.appendChild(nli);
          });
      } else {
        navMore.classList.remove('has-items');
      }
      navOverflow.hidden = true;
      navToggle.setAttribute('aria-expanded', 'false');
    }

    var rAF;
    var schedule = function () {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(layout);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(schedule); }
    layout();

    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navOverflow.hidden = open;
    });
    document.addEventListener('click', function (e) {
      if (!navMore.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        navOverflow.hidden = true;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { navToggle.setAttribute('aria-expanded', 'false'); navOverflow.hidden = true; }
    });
  }

  document.querySelectorAll('a[data-section]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('data-section');
      var el = id && document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) { history.replaceState(null, '', '#' + id); }
        if (navOverflow) { navOverflow.hidden = true; if (navToggle) navToggle.setAttribute('aria-expanded', 'false'); }
      }
    });
  });

  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var open = item.classList.toggle('open');
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  var filterBtns = document.querySelectorAll('.gal-filter button');
  var galItems = document.querySelectorAll('.gal-item');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      filterBtns.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      var f = b.getAttribute('data-filter');
      galItems.forEach(function (it) {
        it.style.display = (f === 'all' || it.getAttribute('data-cat') === f) ? '' : 'none';
      });
    });
  });

  var lb = document.getElementById('lightbox');
  if (lb) {
    var media = lb.querySelector('.lightbox-media');
    var lbTitle = lb.querySelector('.lb-title');
    var lbCat = lb.querySelector('.lb-cat');
    var closeLb = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };
    galItems.forEach(function (it) {
      it.addEventListener('click', function () {
        var title = it.getAttribute('data-title') || '';
        var cat = it.getAttribute('data-cat') || '';
        var tone = it.getAttribute('data-tone') || 'a';
        if (media) { media.textContent = title; media.className = 'lightbox-media tone-' + tone; }
        if (lbTitle) lbTitle.textContent = title;
        if (lbCat) lbCat.textContent = cat;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    lb.querySelector('.lightbox-close').addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }
})();
