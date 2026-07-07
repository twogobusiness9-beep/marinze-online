/* Marinze Website — interactions */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- Header: solid on scroll ---- */
    var header = document.getElementById('site-header');
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- Mobile nav ---- */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.primary-nav');

    var closeNav = function () {
      if (!nav || !toggle) return;
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    };

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeNav);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeNav();
      });
    }

    /* ---- Smart nav: smooth-scroll on the homepage, navigate elsewhere ---- */
    // Nav/footer/CTA links point to real routes (/about/, /projects/, …). On the
    // homepage every section is present, so intercept those clicks and smooth-scroll
    // to the matching section instead of loading a new page. On any other page the
    // links are left alone and navigate normally.
    var isHomePage = (function () {
      var path = location.pathname.replace(/index\.html$/, '');
      return path === '/' || path === '';
    })();

    if (isHomePage) {
      document.querySelectorAll('a[data-section]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          // Let modified / non-left clicks (open in new tab, etc.) behave normally.
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var id = link.getAttribute('data-section');
          var target = id && document.getElementById(id);
          if (!target) return; // section not on this page — allow normal navigation
          e.preventDefault();
          closeNav();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (history.replaceState) history.replaceState(null, '', '#' + id);
        });
      });
    }

    /* ---- Project page tabs ---- */
    document.querySelectorAll('.project').forEach(function (project) {
      var tabs = project.querySelectorAll('.project-tab');
      var panels = project.querySelectorAll('.project-panel');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = tab.getAttribute('data-target');

          tabs.forEach(function (t) {
            var active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', String(active));
          });
          panels.forEach(function (panel) {
            panel.classList.toggle('is-active', panel.id === target);
          });
        });
      });
    });

    /* ---- Lightbox ---- */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    var closeLightbox = function () {
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (lightboxImg) lightboxImg.src = '';
      document.body.style.overflow = '';
    };

    if (lightbox && lightboxImg) {
      document.querySelectorAll('.shot-frame').forEach(function (frame) {
        frame.addEventListener('click', function () {
          var full = frame.getAttribute('data-full');
          var img = frame.querySelector('img');
          if (!full) return;
          lightboxImg.src = full;
          lightboxImg.alt = img ? img.alt : '';
          lightbox.classList.add('open');
          lightbox.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        });
      });

      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target === lightboxClose) closeLightbox();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
      });
    }

    /* ---- Project detail modals ---- */
    var openModal = null;
    var lastFocus = null;

    var closeModal = function () {
      if (!openModal) return;
      var frame = openModal.querySelector('.pm-frame');
      if (frame) frame.removeAttribute('src'); // stop the embedded site
      openModal.setAttribute('hidden', '');
      openModal = null;
      if (!document.querySelector('.lightbox.open')) document.body.style.overflow = '';
      if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    };

    document.querySelectorAll('[data-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var modal = document.getElementById(trigger.getAttribute('data-open'));
        if (!modal) return;
        lastFocus = trigger;
        var frame = modal.querySelector('.pm-frame');
        if (frame && !frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
        modal.removeAttribute('hidden');
        modal.scrollTop = 0;
        openModal = modal;
        document.body.style.overflow = 'hidden';
        var closeBtn = modal.querySelector('.pm-close');
        if (closeBtn) closeBtn.focus();
      });
    });

    document.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openModal && !document.querySelector('.lightbox.open')) closeModal();
    });

    /* ---- Contact form (Web3Forms) ---- */
    var form = document.getElementById('contact-form');
    if (form) {
      var statusEl = document.getElementById('form-status');
      var submitBtn = form.querySelector('.contact-submit');
      var submitLabel = submitBtn ? submitBtn.textContent : 'Send Message';

      // Searchable, accessible time-zone combobox (ARIA listbox pattern).
      var tzCombobox = (function () {
        var root = document.querySelector('[data-combobox]');
        if (!root) return { preselect: function () {}, ensureValue: function () {} };
        var input = root.querySelector('input[role="combobox"]');
        var list = root.querySelector('.combobox-list');
        var toggleBtn = root.querySelector('.combobox-toggle');
        var options = Array.prototype.slice.call(list.querySelectorAll('.combobox-option'));
        var activeIndex = -1;

        var visible = function () { return options.filter(function (o) { return !o.hidden; }); };
        var isOpen = function () { return !list.hidden; };
        var open = function () { list.hidden = false; root.classList.add('open'); input.setAttribute('aria-expanded', 'true'); };
        var selected = function () { return options.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0]; };

        var setActive = function (i) {
          var vis = visible();
          options.forEach(function (o) { o.classList.remove('active'); });
          activeIndex = i;
          if (i >= 0 && i < vis.length) {
            vis[i].classList.add('active');
            input.setAttribute('aria-activedescendant', vis[i].id);
            vis[i].scrollIntoView({ block: 'nearest' });
          } else {
            input.removeAttribute('aria-activedescendant');
          }
        };
        var close = function () { list.hidden = true; root.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); setActive(-1); };

        var filter = function (q) {
          q = (q || '').trim().toLowerCase();
          var any = false;
          options.forEach(function (o) {
            var match = !q || o.getAttribute('data-value').toLowerCase().indexOf(q) !== -1;
            o.hidden = !match; if (match) any = true;
          });
          var empty = list.querySelector('.combobox-empty');
          if (!any) {
            if (!empty) { empty = document.createElement('li'); empty.className = 'combobox-empty'; empty.textContent = 'No matching time zone'; list.appendChild(empty); }
            empty.hidden = false;
          } else if (empty) { empty.hidden = true; }
        };

        var select = function (opt) {
          if (!opt) return;
          input.value = opt.getAttribute('data-value');
          options.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
          opt.setAttribute('aria-selected', 'true');
        };

        var syncActive = function () { var s = selected(); var vis = visible(); setActive(s ? vis.indexOf(s) : -1); };

        input.addEventListener('focus', function () { filter(''); open(); syncActive(); });
        input.addEventListener('click', function () { if (!isOpen()) { filter(''); open(); syncActive(); } });
        input.addEventListener('input', function () { filter(input.value); open(); setActive(visible().length ? 0 : -1); });
        toggleBtn.addEventListener('click', function () { if (isOpen()) { close(); } else { filter(''); open(); input.focus(); syncActive(); } });

        input.addEventListener('keydown', function (e) {
          var vis = visible();
          if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen()) { filter(''); open(); } setActive(activeIndex < 0 ? 0 : Math.min(activeIndex + 1, vis.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen()) { filter(''); open(); } setActive(Math.max(activeIndex - 1, 0)); }
          else if (e.key === 'Enter') { if (isOpen() && activeIndex >= 0) { e.preventDefault(); select(vis[activeIndex]); close(); } }
          else if (e.key === 'Escape') { if (isOpen()) { e.preventDefault(); close(); } }
          else if (e.key === 'Tab') { close(); }
        });

        // mousedown (not click) so selection beats the input blur
        list.addEventListener('mousedown', function (e) {
          var opt = e.target.closest('.combobox-option');
          if (opt) { e.preventDefault(); select(opt); close(); input.focus(); }
        });
        document.addEventListener('click', function (e) { if (!root.contains(e.target)) close(); });

        var preselect = function () {
          var off = -new Date().getTimezoneOffset();
          var match = options.filter(function (o) { return parseInt(o.getAttribute('data-offset'), 10) === off; })[0];
          if (match) select(match);
        };
        return { preselect: preselect, ensureValue: function () { if (!input.value) preselect(); } };
      })();
      tzCombobox.preselect();

      var setError = function (input, msg) {
        var field = input.closest('.field');
        var err = field ? field.querySelector('.field-error') : null;
        if (field) field.classList.toggle('invalid', !!msg);
        if (err) err.textContent = msg || '';
        return !msg;
      };
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var validators = {
        'cf-name': function (v) { return v.trim() ? '' : 'Please enter your full name.'; },
        'cf-email': function (v) { if (!v.trim()) return 'Please enter your email address.'; return emailRe.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
        'cf-details': function (v) { return v.trim() ? '' : 'Please tell me a little about your project.'; }
      };
      Object.keys(validators).forEach(function (id) {
        var input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('input', function () {
          if (input.closest('.field').classList.contains('invalid')) setError(input, validators[id](input.value));
        });
      });

      var showStatus = function (type, msg) {
        if (!statusEl) return;
        statusEl.hidden = false;
        statusEl.className = 'form-banner form-banner-' + (type === 'success' ? 'success' : 'error');
        statusEl.textContent = msg;
      };
      var clearStatus = function () { if (statusEl) { statusEl.hidden = true; statusEl.textContent = ''; } };

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearStatus();

        var firstInvalid = null;
        Object.keys(validators).forEach(function (id) {
          var input = document.getElementById(id);
          if (!input) return;
          if (!setError(input, validators[id](input.value)) && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

        tzCombobox.ensureValue();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (r.ok && r.data && r.data.success) {
              showStatus('success', 'Thank you! Your message has been sent — I\'ll get back to you within 24 hours.');
              form.reset();
              tzCombobox.preselect();
              Object.keys(validators).forEach(function (id) { var el = document.getElementById(id); if (el) setError(el, ''); });
            } else {
              showStatus('error', (r.data && r.data.message) ? r.data.message : 'Sorry, your message could not be sent. Please try again.');
            }
          })
          .catch(function () {
            showStatus('error', 'Something went wrong. Please try again, or email me directly at twogobusiness9@gmail.com.');
          })
          .then(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          });
      });
    }

    /* ---- Reveal on scroll ---- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }

  });
})();
