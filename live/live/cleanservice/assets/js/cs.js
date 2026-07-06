( function () {
	'use strict';

	/* ---------- Bilingual language switch (ES default) ---------- */
	function setLang( lang ) {
		lang = ( 'en' === lang ) ? 'en' : 'es';
		document.documentElement.setAttribute( 'lang', 'en' === lang ? 'en' : 'es-MX' );
		try { localStorage.setItem( 'cs_lang', lang ); } catch ( e ) {}

		document.querySelectorAll( '[data-i18n]' ).forEach( function ( el ) {
			var v = el.getAttribute( 'data-' + lang );
			if ( null !== v ) { el.textContent = v; }
		} );
		document.querySelectorAll( '[data-ph-es]' ).forEach( function ( el ) {
			var v = el.getAttribute( 'data-ph-' + lang );
			if ( null !== v ) { el.setAttribute( 'placeholder', v ); }
		} );
		document.querySelectorAll( '.lang-btn' ).forEach( function ( b ) {
			b.classList.toggle( 'active', b.getAttribute( 'data-lang' ) === lang );
		} );
	}

	var saved = 'es';
	try { saved = localStorage.getItem( 'cs_lang' ) || 'es'; } catch ( e ) {}
	setLang( saved );

	document.querySelectorAll( '.lang-btn' ).forEach( function ( b ) {
		b.addEventListener( 'click', function () { setLang( b.getAttribute( 'data-lang' ) ); } );
	} );

	/* ---------- Mobile navigation (proven pattern) ---------- */
	var toggle = document.querySelector( '.nav-toggle' );
	var nav = document.querySelector( '.primary-nav' );
	if ( toggle && nav ) {
		toggle.addEventListener( 'click', function () {
			var open = nav.classList.toggle( 'open' );
			toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
		nav.addEventListener( 'click', function ( e ) {
			var a = e.target.closest( 'a' );
			if ( ! a ) { return; }
			var li = a.parentElement;
			if ( li && li.classList.contains( 'menu-item-has-children' ) ) {
				e.preventDefault();
				li.classList.toggle( 'open' );
				return;
			}
			nav.classList.remove( 'open' );
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
	}

	/* ---------- FAQ accordion ---------- */
	document.querySelectorAll( '.faq-item .faq-q' ).forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			var item = btn.closest( '.faq-item' );
			var open = item.classList.toggle( 'open' );
			btn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	} );

	/* ---------- Inquiry form -> admin-ajax ---------- */
	var form = document.getElementById( 'csForm' );
	if ( ! form || 'undefined' === typeof csData ) { return; }

	form.addEventListener( 'submit', function ( e ) {
		e.preventDefault();
		var submit = form.querySelector( '[type="submit"]' );
		var original = submit ? submit.textContent : '';
		if ( submit ) { submit.disabled = true; submit.textContent = '…'; }

		var data = new FormData( form );
		data.append( 'action', 'cs_inquiry' );
		data.append( 'nonce', csData.nonce );

		fetch( csData.ajaxUrl, { method: 'POST', body: data } )
			.then( function ( r ) { return r.json().then( function ( j ) { return { ok: r.ok, body: j }; } ); } )
			.then( function ( res ) {
				if ( res.ok && res.body && res.body.success ) {
					form.style.display = 'none';
					var s = document.getElementById( 'csSuccess' );
					if ( s ) { s.classList.add( 'is-visible' ); }
				} else {
					alert( document.documentElement.lang === 'en' ? 'Something went wrong. Please message us on WhatsApp.' : 'Ocurrió un error. Escríbenos por WhatsApp, por favor.' );
					if ( submit ) { submit.disabled = false; submit.textContent = original; }
				}
			} )
			.catch( function () {
				alert( document.documentElement.lang === 'en' ? 'Could not reach the server. Please message us on WhatsApp.' : 'No pudimos conectar. Escríbenos por WhatsApp, por favor.' );
				if ( submit ) { submit.disabled = false; submit.textContent = original; }
			} );
	} );
} )();
