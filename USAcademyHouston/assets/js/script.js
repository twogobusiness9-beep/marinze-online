(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    var header = document.getElementById('site-header');
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle('scrolled', window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var syncHeaderHeight = function () {
      if (!header) return;
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight, { passive: true });
    if (window.ResizeObserver) { new ResizeObserver(syncHeaderHeight).observe(header); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncHeaderHeight); }

    var primaryNav = document.querySelector('.primary-nav');
    var navList    = document.getElementById('nav-list');
    var moreWrap   = document.getElementById('nav-more');
    var moreToggle = document.getElementById('nav-toggle');
    var overflow   = document.getElementById('nav-overflow');

    var closeMenu = function (restoreFocus) {
      if (!overflow || !moreToggle) return;
      overflow.classList.remove('open');
      overflow.hidden = true;
      moreToggle.classList.remove('open');
      moreToggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) moreToggle.focus();
    };

    if (primaryNav && navList && moreWrap && moreToggle && overflow) {
      var navItems   = Array.prototype.slice.call(navList.children);
      var priorityOf = function (li) { return parseInt(li.getAttribute('data-priority'), 10) || 0; };
      var indexOf    = function (li) { return parseInt(li.getAttribute('data-index'), 10) || 0; };

      var recalc = function () {
        var menuWasOpen = overflow.classList.contains('open');

        navItems.forEach(function (li) { navList.appendChild(li); });
        moreWrap.classList.remove('has-overflow');


        if (navList.scrollWidth > navList.clientWidth + 1) {
          moreWrap.classList.add('has-overflow');
          var guard = 0;
          while (navList.scrollWidth > navList.clientWidth + 1 && navList.children.length && guard++ < 50) {
            var visible = Array.prototype.slice.call(navList.children);
            var victim = visible[0];
            visible.forEach(function (li) { if (priorityOf(li) > priorityOf(victim)) victim = li; });
            var placed = false;
            Array.prototype.slice.call(overflow.children).forEach(function (li) {
              if (!placed && indexOf(victim) < indexOf(li)) { overflow.insertBefore(victim, li); placed = true; }
            });
            if (!placed) overflow.appendChild(victim);
          }
        }

        var hasOverflow = overflow.children.length > 0;
        moreWrap.classList.toggle('has-overflow', hasOverflow);
        if (!hasOverflow) { closeMenu(); }
        else if (menuWasOpen) { overflow.hidden = false; overflow.classList.add('open'); }
      };

      moreToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !overflow.classList.contains('open');
        overflow.hidden = !willOpen;
        overflow.classList.toggle('open', willOpen);
        moreToggle.classList.toggle('open', willOpen);
        moreToggle.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) { var first = overflow.querySelector('a'); if (first) first.focus(); }
      });
      document.addEventListener('click', function (e) { if (!moreWrap.contains(e.target)) closeMenu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overflow.classList.contains('open')) closeMenu(true); });
      overflow.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });

      var rafId;
      var schedule = function () { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(recalc); };
      window.addEventListener('resize', schedule, { passive: true });
      if (window.ResizeObserver) { new ResizeObserver(schedule).observe(document.querySelector('.header-inner')); }
      schedule();
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(schedule); }
    }

    var isHomePage = (function () {
      var path = location.pathname.replace(/index\.html$/, '');
      return path === '/' || path === '';
    })();

    if (isHomePage) {
      document.querySelectorAll('a[data-section]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var id = link.getAttribute('data-section');
          var target = id && document.getElementById(id);
          if (!target) return;
          e.preventDefault();
          closeMenu();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + id);
        });
      });
    }

    var lightbox = document.getElementById('lightbox');
    var lbPanel  = document.getElementById('lightbox-panel');
    var lbCap    = document.getElementById('lightbox-cap');
    var lbClose  = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    var closeLightbox = function () {
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    if (lightbox && lbPanel) {
      document.querySelectorAll('.gallery-tile').forEach(function (tile) {
        tile.addEventListener('click', function () {
          var full = tile.getAttribute('data-full');
          lbPanel.setAttribute('data-tone', tile.getAttribute('data-tone') || 'sky');
          lbPanel.style.backgroundImage = full ? 'url("' + full + '")' : '';
          if (lbCap) {
            var t = tile.getAttribute('data-title') || '';
            var c = tile.getAttribute('data-cat') || '';
            lbCap.textContent = c ? (t + ' · ' + c) : t;
          }
          lightbox.classList.add('open');
          lightbox.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          if (lbClose) lbClose.focus();
        });
      });
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target === lbClose) closeLightbox();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    document.querySelectorAll('form.usa-form').forEach(function (form) {
      var statusEl  = form.querySelector('.form-status');
      var submitBtn = form.querySelector('[type="submit"]');
      var submitLabel = submitBtn ? submitBtn.textContent : 'Send';

      var fieldOf = function (input) { return input.closest('.field'); };
      var setError = function (input, msg) {
        var field = fieldOf(input);
        var err = field ? field.querySelector('.field-error') : null;
        if (field) field.classList.toggle('invalid', !!msg);
        if (err) err.textContent = msg || '';
        return !msg;
      };
      var validate = function (input) {
        var val = (input.value || '').trim();
        if (input.type === 'checkbox') return input.checked ? '' : (input.getAttribute('data-error') || 'This field is required.');
        if (input.type === 'radio') {
          var grp = form.querySelectorAll('input[name="' + input.name + '"]');
          var picked = Array.prototype.some.call(grp, function (r) { return r.checked; });
          return picked ? '' : (input.getAttribute('data-error') || 'Please make a selection.');
        }
        if (input.hasAttribute('required') && !val) return input.getAttribute('data-error') || 'This field is required.';
        if (input.type === 'email' && val && !emailRe.test(val)) return 'Please enter a valid email address.';
        return '';
      };
      var validatedInputs = Array.prototype.slice.call(
        form.querySelectorAll('input[required], textarea[required], select[required]')
      );

      validatedInputs.forEach(function (input) {
        var evt = (input.type === 'checkbox' || input.type === 'radio') ? 'change' : 'input';
        var targets = input.type === 'radio' ? form.querySelectorAll('input[name="' + input.name + '"]') : [input];
        Array.prototype.forEach.call(targets, function (t) {
          t.addEventListener(evt, function () {
            if (fieldOf(input) && fieldOf(input).classList.contains('invalid')) setError(input, validate(input));
          });
        });
      });

      var showStatus = function (type, msg) {
        if (!statusEl) return;
        statusEl.hidden = false;
        statusEl.className = 'form-status form-banner-' + (type === 'success' ? 'success' : 'error');
        statusEl.textContent = msg;
        statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (statusEl) { statusEl.hidden = true; statusEl.textContent = ''; }

        var hp = form.querySelector('.usa-hp');
        if (hp && hp.value) { form.reset(); showStatus('success', 'Thank you! Your message has been sent.'); return; }

        var firstInvalid = null;
        validatedInputs.forEach(function (input) {
          if (!setError(input, validate(input)) && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

        var accessKey = form.querySelector('input[name="access_key"]');
        if (!accessKey || /YOUR_WEB3FORMS/.test(accessKey.value)) {
          showStatus('error', 'This form is not connected yet. Please call us at (281) 741-3634 or email usacademyhouston@gmail.com — we would love to hear from you!');
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (r.ok && r.data && r.data.success) {
              showStatus('success', form.getAttribute('data-success') || 'Thank you! We have received your message and will be in touch soon.');
              form.reset();
              validatedInputs.forEach(function (el) { setError(el, ''); });
            } else {
              showStatus('error', (r.data && r.data.message) ? r.data.message : 'Sorry, something went wrong. Please try again or call us.');
            }
          })
          .catch(function () {
            showStatus('error', 'Something went wrong. Please try again, or call us at (281) 741-3634.');
          })
          .then(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
          });
      });
    });

    var revealEls = document.querySelectorAll('.reveal');
    var revealAll = function () { revealEls.forEach(function (el) { el.classList.add('in'); }); };
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
      setTimeout(function () { if (!document.querySelector('.reveal.in')) revealAll(); }, 1500);
    } else {
      revealAll();
    }

  });
})();
