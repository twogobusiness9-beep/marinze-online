(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    var header = document.getElementById('site-header');
    var onScroll = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 16); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var navList    = document.getElementById('nav-list');
    var moreWrap   = document.getElementById('nav-more');
    var moreToggle = document.getElementById('nav-toggle');
    var overflow   = document.getElementById('nav-overflow');
    var headerInner = document.querySelector('.header-inner');

    var closeNav = function (restoreFocus) {
      if (!overflow || !moreToggle) return;
      overflow.classList.remove('open');
      overflow.hidden = true;
      moreToggle.classList.remove('open');
      moreToggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) moreToggle.focus();
    };

    if (navList && moreWrap && moreToggle && overflow) {
      var indexOf    = function (li) { return parseInt(li.getAttribute('data-index'), 10) || 0; };
      var priorityOf = function (li) { return parseInt(li.getAttribute('data-priority'), 10) || 0; };
      var navItems = Array.prototype.slice.call(navList.children);

      var recalc = function () {
        var wasOpen = overflow.classList.contains('open');

        navItems.forEach(function (li) { navList.appendChild(li); });
        moreWrap.classList.remove('has-overflow');

        if (navList.clientWidth > 0 && navList.scrollWidth > navList.clientWidth + 1) {
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
        if (!hasOverflow) closeNav();
        else if (wasOpen) { overflow.hidden = false; overflow.classList.add('open'); }
      };

      moreToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !overflow.classList.contains('open');
        overflow.hidden = !willOpen;
        overflow.classList.toggle('open', willOpen);
        moreToggle.classList.toggle('open', willOpen);
        moreToggle.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) { var f = overflow.querySelector('a'); if (f) f.focus(); }
      });
      document.addEventListener('click', function (e) { if (!moreWrap.contains(e.target)) closeNav(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overflow.classList.contains('open')) closeNav(true); });
      overflow.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });

      var rafId;
      var schedule = function () { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(recalc); };
      window.addEventListener('resize', schedule, { passive: true });
      window.addEventListener('load', schedule, { passive: true });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
      if (window.ResizeObserver && headerInner) { new ResizeObserver(schedule).observe(headerInner); }
      recalc();
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(schedule); }
    } else {
      closeNav = function () {};
    }

    document.querySelectorAll('.nav-list .has-sub > .nav-sub-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var li = btn.closest('.has-sub');
        if (!li || (li.parentElement && li.parentElement.id === 'nav-overflow')) return;
        e.preventDefault();
        var open = !li.classList.contains('open');
        document.querySelectorAll('.nav-list .has-sub.open').forEach(function (o) {
          if (o !== li) { o.classList.remove('open'); var b = o.querySelector('.nav-sub-toggle'); if (b) b.setAttribute('aria-expanded', 'false'); }
        });
        li.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-sub')) {
        document.querySelectorAll('.nav-list .has-sub.open').forEach(function (o) { o.classList.remove('open'); var b = o.querySelector('.nav-sub-toggle'); if (b) b.setAttribute('aria-expanded', 'false'); });
      }
    });

    var isHome = (function () { var p = location.pathname.replace(/index\.html$/, ''); return p === '/' || p === ''; })();
    if (isHome) {
      document.querySelectorAll('a[data-section]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var id = link.getAttribute('data-section');
          var target = id && document.getElementById(id);
          if (!target) return;
          e.preventDefault();
          closeNav();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + id);
        });
      });
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    document.querySelectorAll('form.ace-form').forEach(function (form) {
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
        if (input.type === 'radio') {
          var grp = form.querySelectorAll('input[name="' + input.name + '"]');
          var picked = Array.prototype.some.call(grp, function (r) { return r.checked; });
          return picked ? '' : (input.getAttribute('data-error') || 'Please make a selection.');
        }
        if (input.hasAttribute('required') && !val) return input.getAttribute('data-error') || 'This field is required.';
        if (input.type === 'email' && val && !emailRe.test(val)) return input.getAttribute('data-error') || 'Please enter a valid email address.';
        return '';
      };
      var validated = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required], select[required]'));

      validated.forEach(function (input) {
        var evt = (input.type === 'radio') ? 'change' : 'input';
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

        var hp = form.querySelector('.ace-hp');
        if (hp && hp.value) { form.reset(); showStatus('success', form.getAttribute('data-success') || 'Thank you!'); return; }

        var firstInvalid = null;
        validated.forEach(function (input) { if (!setError(input, validate(input)) && !firstInvalid) firstInvalid = input; });
        if (firstInvalid) { firstInvalid.focus(); return; }

        var accessKey = form.querySelector('input[name="access_key"]');
        if (!accessKey || /YOUR_WEB3FORMS/.test(accessKey.value)) {
          showStatus('error', 'This form is not connected yet. Please call us at 410 600 3959 or email Hello@acedentalellicottcity.com.');
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

        fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (r.ok && r.data && r.data.success) {
              showStatus('success', form.getAttribute('data-success') || 'Thank you! We will be in touch soon.');
              form.reset();
              validated.forEach(function (el) { setError(el, ''); });
            } else {
              showStatus('error', (r.data && r.data.message) ? r.data.message : 'Sorry, something went wrong. Please try again or call us.');
            }
          })
          .catch(function () { showStatus('error', 'Something went wrong. Please try again, or call us at 410 600 3959.'); })
          .then(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; } });
      });
    });

    var revealEls = document.querySelectorAll('.reveal');
    var revealAll = function () { revealEls.forEach(function (el) { el.classList.add('in'); }); };
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
      setTimeout(function () { if (!document.querySelector('.reveal.in')) revealAll(); }, 1500);
    } else {
      revealAll();
    }

  });
})();
