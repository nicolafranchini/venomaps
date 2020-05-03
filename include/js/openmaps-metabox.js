/*!
 * openmaps
 *
 * Copyright 2020 Nicola Franchini
 */
 jQuery(document).ready(function($){
	'use strict';

	// Load media library
	var metaImageFrame;
	$(document).on('click', '.openmaps_marker_upload_btn', function(e){
		var field = $( this ).prev('.openmaps_custom_marker-wrap').find( '.openmaps_custom_marker' );
		e.preventDefault();
		metaImageFrame = wp.media.frames.metaImageFrame = wp.media();
		metaImageFrame.on('select', function() {
			var media_attachment = metaImageFrame.state().get('selection').first().toJSON();
			$( field ).val(media_attachment.url);
		});
		metaImageFrame.open();
	});

	$(document).on('click', '.openmaps_marker_remove_btn', function(e){
		var field = $( this ).parent().find( '.openmaps_custom_marker' );
		e.preventDefault();
		$( field ).val('');
	});

	// var editorid = 'openmaps_infobox';
	var settings = {
	    tinymce: true,
	    quicktags: {
	        'buttons': 'strong,em,link,ul,ol,li,del,close'
	    }
	}

	$('.openmaps_marker_editor').each(function(){
		var editorid = $(this).find('textarea').attr('id');
		wp.editor.initialize( editorid, settings );
	})

	$('.wpol-new-marker').on('click', function(){

		if ($('.wrap-clone').length) {
			var clone = $('.wrap-clone').last().find('.clone-marker').clone();
		} else {
			var clone = $('.clone-marker').last().clone();
		}

		var cloneindex = parseFloat(clone.data('index'));
		var cloneindexnew = cloneindex + 1;

		var wrapclone = '<div class="wrap-clone" id="wrap-clone-'+cloneindexnew+'"><strong class="wpol-badge"> #'+cloneindexnew+'</strong></div>';

		clone.attr('data-index', cloneindexnew);
		clone.find('input').attr('value', '');
		clone.find('option:selected').removeAttr('selected');

		clone.find('input').each(function() {
		    this.name = this.name.replace('['+cloneindex+']', '['+cloneindexnew+']');
		});

		$(wrapclone).appendTo('.wrap-marker');

		clone.appendTo('#wrap-clone-'+cloneindexnew);

		var text_editor = '<div class="wp-editor-container openmaps_marker_editor"><textarea id="openmaps_infobox_'+cloneindexnew+'" name="openmaps_marker['+cloneindexnew+'][infobox]" class="wp-editor-area" rows="4"></textarea></div>';
		$(text_editor).appendTo('#wrap-clone-'+cloneindexnew);

		wp.editor.initialize( 'openmaps_infobox_'+cloneindexnew, settings );

		var removebtn = '<div class="wpol-remove-marker wpol-btn-link"><span class="dashicons dashicons-no"></span></div>';
		$(removebtn).appendTo('#wrap-clone-'+cloneindexnew);

	});

	$(document).on('click', '.wpol-remove-marker', function(){
		$(this).parent('.wrap-clone').remove();
	});

	function disableEnterKey(evt) {
		var evt = (evt) ? evt : ((event) ? event : null);
		var elem = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
		if ((evt.keyCode == 13) && (elem.type =='text' || elem.type =='url' || elem.type =='number'))  {
			return false;
		}
	}

	document.onkeypress = disableEnterKey;
});
