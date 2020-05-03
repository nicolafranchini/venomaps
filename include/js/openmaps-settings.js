/*!
 * openmaps
 *
 * Copyright 2020 Nicola Franchini
 */
 jQuery(document).ready(function($){
	'use strict';

	// repeatable items
	$('.wpol-call-repeat').on('click', function(){
		var repgroup = $('.wpol-repeatable-group');
		var lastitemnum = $('.wpol-repeatable-item').last().data('number');
		var newnum = parseFloat(lastitemnum) + 1;
		var newitem = '<div class="wpol-repeatable-item wpol-form-group" data-number="'+newnum+'"><input type="text" class="all-options" name="openmaps_settings[style]['+newnum+'][name]" value="map style '+newnum+'"> <input type="url" class="regular-text" name="openmaps_settings[style]['+newnum+'][url]" value="" placeholder="https://api.maptiler.com/maps/.../style.json?key=..."></div>';
		$('.wpol-repeatable-group').append(newitem);
	});

	var pos = ol.proj.fromLonLat([-74.005974, 40.712776]);

	var view = new ol.View({
		  center: pos,
		  zoom: 2
		});

	// Init map
	var map = new ol.Map({
		target: 'wpol-admin-map',
		view: view,
		layers: [
		  new ol.layer.Tile({
		    source: new ol.source.OSM()
		  })
		],
		interactions: ol.interaction.defaults({mouseWheelZoom:false})
	});

    // Add Marker
    var infomarker = new ol.Overlay({
      position: pos,
      positioning: 'center-center',
      offset: [0, -20],
      element: document.getElementById('infomarker_admin'),
    });
    map.addOverlay(infomarker);

    // Update marker position and lat lon fields
	map.on('click', function(evt) {
		var coordinate = evt.coordinate;
		var lonlat = ol.proj.toLonLat(coordinate);
		$('.openmaps-get-lat').val(lonlat[1]);
		$('.openmaps-get-lon').val(lonlat[0]);
		infomarker.setPosition(coordinate);
	});

	// Update lat lon fields
	function georesponse(response){
		var lat = response[0].lat;
		var lon = response[0].lon;
		var newcoord = ol.proj.fromLonLat([lon, lat]);
		infomarker.setPosition(newcoord);
		
		view.setCenter(newcoord);
		view.setZoom(8);

		$('.openmaps-get-lat').val(lat);
		$('.openmaps-get-lon').val(lon);
	}

	// Get coordinates from Address.
	$('.openmaps-get-coordinates').on('click', function(){

		var button = $(this);
		var address = $('.openmaps-set-address').val()

		if ( address.length > 3 ) {
			button.hide();
			var encoded = encodeURIComponent(address);
			$.ajax({
		        url: 'https://nominatim.openstreetmap.org/search?q='+encoded+'&format=json',
		        type: 'GET',
		    }).done(function(res) {
			    georesponse(res);
			})
			.always(function() {
			    button.fadeIn();
			});
		}
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
