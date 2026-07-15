( function () {
	'use strict';

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

			if ( li && li.classList.contains( 'menu-item-has-children' ) ) {
				e.preventDefault();
				li.classList.toggle( 'open' );
				return;
			}

			nav.classList.remove( 'open' );
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
	}

	document.querySelectorAll( '.faq-item .faq-q' ).forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			var item = btn.closest( '.faq-item' );
			var open = item.classList.toggle( 'open' );
			btn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	} );

	var form = document.getElementById( 'vecForm' );
	if ( ! form || 'undefined' === typeof vecForm ) {
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
		data.append( 'action', 'vec_inquiry' );
		data.append( 'nonce', vecForm.nonce );

		fetch( vecForm.ajaxUrl, { method: 'POST', body: data } )
			.then( function ( r ) { return r.json().then( function ( j ) { return { ok: r.ok, body: j }; } ); } )
			.then( function ( res ) {
				if ( res.ok && res.body && res.body.success ) {
					form.style.display = 'none';
					var success = document.getElementById( 'vecSuccess' );
					if ( success ) { success.classList.add( 'is-visible' ); }
				} else {
					var msg = ( res.body && res.body.data && res.body.data.message ) ? res.body.data.message : 'Something went wrong. For anything urgent, please call (416) 920-2002.';
					alert( msg );
					if ( submit ) { submit.disabled = false; submit.textContent = original; }
				}
			} )
			.catch( function () {
				alert( 'We could not reach the server. For anything urgent, please call (416) 920-2002.' );
				if ( submit ) { submit.disabled = false; submit.textContent = original; }
			} );
	} );
} )();
