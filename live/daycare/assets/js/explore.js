( function () {
	'use strict';

	// Mobile navigation toggle.
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
			// Parent item with a submenu: toggle the submenu instead of navigating/closing.
			if ( li && li.classList.contains( 'menu-item-has-children' ) ) {
				e.preventDefault();
				li.classList.toggle( 'open' );
				return;
			}
			// Real link: close the menu (navigation proceeds normally).
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

	// Preferred-campus select updates the embedded map.
	var campusSelect = document.querySelector( 'select[data-map-target]' );
	if ( campusSelect ) {
		var mapFrame = document.getElementById( campusSelect.getAttribute( 'data-map-target' ) );
		var syncMap = function () {
			var opt = campusSelect.options[ campusSelect.selectedIndex ];
			var query = opt ? opt.getAttribute( 'data-map' ) : '';
			if ( mapFrame && query ) {
				mapFrame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent( query ) + '&t=&z=14&ie=UTF8&iwloc=&output=embed';
			}
		};
		campusSelect.addEventListener( 'change', syncMap );
		syncMap();
	}

	// Tour request form -> admin-ajax.
	var form = document.getElementById( 'tourForm' );
	if ( ! form || 'undefined' === typeof marinzeTour ) {
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
		data.append( 'action', 'marinze_tour_request' );
		data.append( 'nonce', marinzeTour.nonce );

		fetch( marinzeTour.ajaxUrl, { method: 'POST', body: data } )
			.then( function ( r ) { return r.json().then( function ( j ) { return { ok: r.ok, body: j }; } ); } )
			.then( function ( res ) {
				if ( res.ok && res.body && res.body.success ) {
					var name = ( data.get( 'full_name' ) || '' ).toString();
					var slot = document.querySelector( '.tour-success-name' );
					if ( slot ) { slot.textContent = name; }
					form.style.display = 'none';
					var success = document.getElementById( 'tourSuccess' );
					if ( success ) { success.classList.add( 'is-visible' ); }
				} else {
					var msg = ( res.body && res.body.data && res.body.data.message ) ? res.body.data.message : 'Something went wrong. Please call (406) 581-5525.';
					alert( msg );
					if ( submit ) { submit.disabled = false; submit.textContent = original; }
				}
			} )
			.catch( function () {
				alert( 'We could not reach the server. Please call (406) 581-5525.' );
				if ( submit ) { submit.disabled = false; submit.textContent = original; }
			} );
	} );
} )();
