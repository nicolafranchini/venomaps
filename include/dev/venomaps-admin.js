import { Map, View, Overlay } from 'ol';

import { fromLonLat, toLonLat } from 'ol/proj';
import { Tile } from 'ol/layer';
import { OSM } from 'ol/source';
import { defaults as interactionDefaults } from 'ol/interaction/defaults';
import { DragPan } from 'ol/interaction';

/*!
 * venomaps admin scripts
 *
 * Copyright 2020 Nicola Franchini
 */
const VenomapsAdmin = function(){
	document.addEventListener("DOMContentLoaded", function(event) {
	// 
		'use strict';
		function prev(el, selector) {
		  const prevEl = el.previousElementSibling;
		  if (!selector || (prevEl && prevEl.matches(selector))) {
		    return prevEl;
		  }
		  return null;
		}
		/*
		 * Load media library
		 */
		var om_metaImageFrame;

		const upmarkers = document.querySelectorAll(".venomaps_marker_upload_btn");

		upmarkers.forEach(function(upmarker) {
			const field = prev(upmarker, '.venomaps_custom_marker-wrap').querySelector( '.venomaps_custom_marker' );
			if (field) {
				upmarker.addEventListener("click", function(e){
					e.preventDefault();
					om_metaImageFrame = wp.media.frames.om_metaImageFrame = wp.media();

					om_metaImageFrame.addEventListener("select", function(){
						var media_attachment = om_metaImageFrame.state().get('selection').first().toJSON();
						field.value = media_attachment.url;
					});
					om_metaImageFrame.open();
				});
			}
		});


		const removemarkers = document.querySelectorAll(".venomaps_marker_remove_btn");
		removemarkers.forEach(function(removemarker) {
			const field = removemarker.parentNode.querySelector( '.venomaps_custom_marker' );
			removemarker.addEventListener("click", function(e){
				e.preventDefault();
				field.value = "";
			});


		});

		/*
		 * Initialize wysiwyg editor
		 */
		var om_editor_settings = {
		    tinymce: true,
		    quicktags: {
		        'buttons': 'strong,em,link,ul,ol,li,del,close'
		    }
		}

		const markereditors = document.querySelectorAll(".venomaps_marker_editor");

		markereditors.forEach(function(markereditor){
			const theeditor = markereditor.querySelector("textarea");
			const editorid = theeditor.id;

			wp.editor.initialize( editorid, om_editor_settings );
		});

		/*
		 * Clone marker box
		 */
		const newmarkers = document.querySelectorAll(".wpol-new-marker");
		newmarkers.forEach(function(newmarker) {
			newmarker.addEventListener("click", function(){
				const wrapclones = document.querySelectorAll(".wrap-clone");
				const clonemarkers = document.querySelectorAll(".clone-marker");

				if (wrapclones.length) {
					var clone = [...wrapclones].at(-1).querySelector(".clone-marker").cloneNode(true);
				} else {
					var clone = [...clonemarkers].at(-1).cloneNode(true);
				}

				var cloneindex = parseFloat(clone.dataset.index);
				var cloneindexnew = cloneindex + 1;

				var wrapclone = '<div class="wrap-clone" id="wrap-clone-'+cloneindexnew+'"><strong class="wpol-badge"> #'+cloneindexnew+'</strong></div>';

				clone.dataset.index = cloneindexnew;

				clone.querySelector("select").selectedIndex = -1;
				clone.querySelectorAll('input[type=checkbox]').forEach(el => el.checked = false);

				const cloneinputs = clone.querySelectorAll("input");

				cloneinputs.forEach(function(cloneinput){
					cloneinput.name = cloneinput.name.replace('['+cloneindex+']', '['+cloneindexnew+']');
					cloneinput.value = "";
				});

				const wrapmarker = document.querySelector(".wrap-marker");
				// wrapmarker.append(wrapclone);
				wrapmarker.innerHTML += wrapclone;

				const clonenew = document.getElementById("wrap-clone-"+cloneindexnew);

				const text_editor = '<div class="wp-editor-container venomaps_marker_editor"><textarea id="venomaps_infobox_'+cloneindexnew+'" name="venomaps_marker['+cloneindexnew+'][infobox]" class="wp-editor-area" rows="4"></textarea></div>';

				clonenew.append(clone);
				clonenew.innerHTML += text_editor;

				var removebtn = '<div class="wpol-remove-marker wpol-btn-link"><span class="dashicons dashicons-no"></span></div>';

				clonenew.innerHTML += removebtn;
				
				wp.editor.initialize( 'venomaps_infobox_'+cloneindexnew, om_editor_settings );

				const removebtnel = clonenew.querySelector(".wpol-remove-marker");
				removebtnel.addEventListener("click", function(){
					clonenew.remove();
				});
			});
		});

		const removebtnels = document.querySelectorAll(".wpol-remove-marker");
		removebtnels.forEach(function(removebtnel){
			removebtnel.addEventListener("click", function(){
				removebtnel.closest(".wrap-clone").remove();
			});
		});

		/*
		 * Geolocation
		 */
		function loadGeolocator(geomap_id, geomarker_id) {

			var timer;
			const latinput = document.querySelector(".venomaps-get-lat");
			const loninput = document.querySelector(".venomaps-get-lon");

	        // if (typeof ol === 'undefined' || ol === null) {
	        //   console.log('WARNING: OpenLayers Library not loaded');
	        //   return false;
	        // }

			var om_map_pos = fromLonLat([-74.005974, 40.712776]);
			var view = new View({
				  center: om_map_pos,
				  zoom: 2
				});

			// Init map
			var map = new Map({
				target: 'wpol-admin-map',
				view: view,
				layers: [
				  new Tile({
				    source: new OSM()
				  })
				],
				interactions: interactionDefaults({mouseWheelZoom:false})
			});

		    // Add Marker
		    var marker_el = document.getElementById(geomarker_id);
		    var infomarker = new Overlay({
				position: om_map_pos,
				positioning: 'center-center',
				// offset: [0, -20],
				element: marker_el,
				stopEvent: false,
				dragging: false
		    });
		    map.addOverlay(infomarker);

		    // Update marker position and lat lon fields

			var dragPan;
			map.getInteractions().forEach(function(interaction){
				if (interaction instanceof DragPan) {
					dragPan = interaction;  
			  }
			});

			marker_el.addEventListener('mousedown', function(evt) {
			  dragPan.setActive(false);
			  infomarker.set('dragging', true);
			});

			map.addEventListener("pointermove", function(evt) {
				if (infomarker.get('dragging') === true) {
			  	infomarker.setPosition(evt.coordinate);
			  }
			});

			map.addEventListener("pointerup", function(evt) {
				if (infomarker.get('dragging') === true) {
			    dragPan.setActive(true);
			    infomarker.set('dragging', false);
				var coordinate = evt.coordinate;
				var lonlat = toLonLat(coordinate);
				latinput.value = lonlat[1];
				loninput.value = lonlat[0];
			  }
			});

			const responseinput = document.querySelector(".venomaps-response");

			// Update lat lon fields
			function georesponse(response){
				var lat, lon;
				responseinput.innerHTML = "";
				if (response[0]) {
					lat = response[0].lat;
					lon = response[0].lon;
					var newcoord = fromLonLat([lon, lat]);
					infomarker.setPosition(newcoord);
					view.setCenter(newcoord);
					view.setZoom(6);
				} else {
					lat = '';
					lon = '';
					responseinput.innerHTML = "Nothing Found";
				}
				latinput.value = lat;
				loninput.value = lon;
			}

			const getcoords = document.querySelector(".venomaps-get-coordinates");

			getcoords.addEventListener("click", function(){
			// Get coordinates from Address.
			// $('.venomaps-get-coordinates').on('click', function(){
				var button = getcoords;
				const address = document.querySelector(".venomaps-set-address").value;

				if ( address.length > 3 ) {
					getcoords.classList.add("hidden");
					var encoded = encodeURIComponent(address);
					var xhttp = new XMLHttpRequest();
					xhttp.open("GET", 'https://nominatim.openstreetmap.org/search?q='+encoded+'&format=json', true);

					xhttp.onload = () => {
						georesponse(JSON.parse(xhttp.response));
						getcoords.classList.remove("hidden");
					};
					xhttp.send();
				}
			});

			function latLonInput(){
				clearTimeout(timer);
				timer = setTimeout(function(){
					var lat = latinput.val();
					var lon = loninput.val();
					var newcoord = fromLonLat([lon, lat]);
					infomarker.setPosition(newcoord);
					view.setCenter(newcoord);
					view.setZoom(6);
				}, 1000);	
			}

			latinput.addEventListener("input", function(){
				latLonInput();
			});
			loninput.addEventListener("input", function(){
				latLonInput();
			});

		}

		const adminmap = document.getElementById("wpol-admin-map");
		const adminmarker = document.getElementById("infomarker_admin");

		if (adminmap && adminmarker) {
			loadGeolocator( 'wpol-admin-map', 'infomarker_admin' );
		}

		/*
		 * Options page repeatable items
		 */

		const callrepeatables = document.querySelectorAll(".wpol-call-repeat");
		const repeatablegroup = document.querySelector(".wpol-repeatable-group");

		callrepeatables.forEach(function(callrepeatable){
			callrepeatable.addEventListener("click", function(){
				const repeatables = document.querySelectorAll(".wpol-repeatable-item");
				const lastitemnum = repeatables[repeatables.length - 1].dataset.number;
				var newnum = parseFloat(lastitemnum) + 1;
				var newitem = '<div class="wpol-repeatable-item wpol-form-group" data-number="'+newnum+'"><input type="text" class="all-options" name="venomaps_settings[style]['+newnum+'][name]" value="map style '+newnum+'"> <input type="url" class="regular-text" name="venomaps_settings[style]['+newnum+'][url]" value="" placeholder="https://provider.ext/{z}/{x}/{y}.png?api_key=..."></div>';
				repeatablegroup.innerHTML += newitem;
			});

		});

		/*
		 * Disable submission with enter key
		 */
		function omDisableEnterKey(evt) {
			var evt = (evt) ? evt : ((event) ? event : null);
			var elem = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
			if ((evt.keyCode == 13) && (elem.type =='text' || elem.type =='url' || elem.type =='number'))  {
				return false;
			}
		}
		document.onkeydown = omDisableEnterKey;

	})
}();
