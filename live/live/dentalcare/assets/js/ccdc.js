( function () {
	'use strict';

	// Mobile navigation.
	var toggle = document.querySelector( '.nav-toggle' );
	var nav = document.querySelector( '.primary-nav' );
	if ( toggle && nav ) {
		toggle.addEventListener( 'click', function () {
			var open = nav.classList.toggle( 'open' );
			toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
		nav.addEventListener( 'click', function ( e ) {
			var a = e.target.closest( 'a' );
			if ( ! a ) {
				return;
			}
			var li = a.parentElement;
			// Parent item with a submenu: toggle it instead of navigating/closing.
			if ( li && li.classList.contains( 'menu-item-has-children' ) ) {
				e.preventDefault();
				li.classList.toggle( 'open' );
				return;
			}
			// Real link: close the menu (navigation proceeds).
			nav.classList.remove( 'open' );
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
	}

	// FAQ accordion.
	document.querySelectorAll( '.faq-item .faq-q' ).forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			var item = btn.closest( '.faq-item' );
			var open = item.classList.toggle( 'open' );
			btn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	} );

	// Appointment request form -> admin-ajax.
	var form = document.getElementById( 'apptForm' );
	if ( ! form || 'undefined' === typeof ccdcAppt ) {
		return;
	}

	form.addEventListener( 'submit', function ( e ) {
		e.preventDefault();

		var submit = form.querySelector( '[type="submit"]' );
		var original = submit ? submit.textContent : '';
		if ( submit ) {
			submit.disabled = true;
			submit.textContent = 'Sending…';
		}

		var data = new FormData( form );
		data.append( 'action', 'ccdc_appt_request' );
		data.append( 'nonce', ccdcAppt.nonce );

		fetch( ccdcAppt.ajaxUrl, { method: 'POST', body: data } )
			.then( function ( r ) { return r.json().then( function ( j ) { return { ok: r.ok, body: j }; } ); } )
			.then( function ( res ) {
				if ( res.ok && res.body && res.body.success ) {
					var slot = document.querySelector( '.appt-success-name' );
					if ( slot ) { slot.textContent = ( data.get( 'full_name' ) || '' ).toString(); }
					form.style.display = 'none';
					var success = document.getElementById( 'apptSuccess' );
					if ( success ) { success.classList.add( 'is-visible' ); }
				} else {
					var msg = ( res.body && res.body.data && res.body.data.message ) ? res.body.data.message : 'Something went wrong. Please call 303-627-8300.';
					alert( msg );
					if ( submit ) { submit.disabled = false; submit.textContent = original; }
				}
			} )
			.catch( function () {
				alert( 'We could not reach the server. Please call 303-627-8300.' );
				if ( submit ) { submit.disabled = false; submit.textContent = original; }
			} );
	} );
} )();
