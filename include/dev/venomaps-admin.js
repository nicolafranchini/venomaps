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
		'use strict';

		let preview_getsource, preview_map, preview_getview;
        let sourcesettings = {};
        let rowdata = {};
		const defaultIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" fill="currentColor" viewBox="0 0 30 30" xml:space="preserve"><path d="M15,1C8.7,1,3.5,6.1,3.5,12.3S8.3,22.8,15,28.7c6.7-5.9,11.5-10.2,11.5-16.4S21.3,1,15,1z M15,17.2 c-2.5,0-4.6-2.1-4.6-4.6c0-2.5,2.1-4.6,4.6-4.6s4.6,2.1,4.6,4.6C19.6,15.1,17.5,17.2,15,17.2z"/></svg>'

		/*
		 * Load CSV
		 */
		function upFile(component){

			const upbutton = component.querySelector( '.vmap-set-uploader' );
			const field = component.querySelector( '.vmap-get-uploader' );
			const processCsvBtn = component.querySelector(".vmap-import-csv");
			const post_id = field.dataset.postId;

			// Select file
			var om_metaImageFrame;

			if (field && upbutton) {
				upbutton.addEventListener("click", function(e){
					e.preventDefault();
					om_metaImageFrame = wp.media.frames.om_metaImageFrame = wp.media();
					om_metaImageFrame.on("select", function(){
						var media_attachment = om_metaImageFrame.state().get('selection').first().toJSON();
						field.value = media_attachment.url;
						processCsvBtn.classList.remove("vmap-hidden");
					});
					om_metaImageFrame.open();
				});
			}

			// Process file
			if (processCsvBtn && post_id) {
				processCsvBtn.addEventListener("click", function(e){
					e.preventDefault;
					const data = {};
					data.url = field.value;
					data.id = post_id,
					sendCsvData(data, component);
				});
			}	
		}

		const allUploaders = document.querySelectorAll(".vmap-uploader");
		allUploaders.forEach(function(component){
			upFile(component);
		});

// TODO: preloader waiting
		function sendCsvData(data, component) {

			const spinner = component.querySelector(".spinner");
			const processCsvBtn = component.querySelector(".vmap-import-csv");
			const responseMsg = component.querySelector(".vmap-response-message");
			const delimiter = component.querySelector('input[name="csv_delimiter"]:checked');

			responseMsg.classList.remove("active");
			spinner.classList.add("is-active");
			processCsvBtn.classList.add("vmap-hidden");

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {

				if (xhttp.readyState == 4) {
					if (xhttp.status == 200) {
						const response_obj = JSON.parse(xhttp.response);
						console.log(response_obj);
						responseMsg.innerText = response_obj;
						responseMsg.classList.add("active");
					}
					spinner.classList.remove("is-active");
					// processCsvBtn.classList.remove("vmap-hidden");
				}
			};

			xhttp.ontimeout = (e) => {
				console.log('Timeout');
			};

			const formData = new FormData();

			formData.append("action", "vmap_set_csv");
			formData.append("vmap_nonce", venomapsAdminVars.nonce);
			formData.append("url", data.url);
			formData.append("post_id", data.id);
			formData.append("delimiter", delimiter.value);

			xhttp.open("POST", venomapsAdminVars.ajax_url, true);
		 	// xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		  	// xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhttp.send(formData);
		}


		function loadIconImage(upmarker, url = false) {

			const field = upmarker.querySelector( '.vmap-modal-get-icon' );
			const upimage = upmarker.querySelector( '.vmap-icon-image' );
			const defaultimage = upmarker.querySelector( '.vmap-icon-default' );
			const removemarkers = upmarker.querySelectorAll( '.venomaps_marker_remove_btn' );

			if (url) {
				const img = new Image();
				img.src = url;
				img.onload = function () {
					upimage.innerHTML = "";
					upimage.append(img);
					upimage.classList.remove("vmap-hidden");
					defaultimage.classList.add("vmap-hidden");
					defaultimage.innerHTML = "";
					removemarkers.forEach(function(removemarker){
						removemarker.classList.remove("vmap-invisible");
					});
				}
				field.value = url;
			} else {
				field.value = "";
				defaultimage.innerHTML = defaultIcon;
				upimage.classList.add("vmap-hidden");
				defaultimage.classList.remove("vmap-hidden");
				removemarkers.forEach(function(removemarker){
					removemarker.classList.add("vmap-invisible");
				});
			}
			// set_icon.value = media_attachment.url;
		}

		/*
		 * Load media library
		 */
		function iconUploader(modal_component){

			if (!modal_component) {
				console.log('Missing modal_component');
				return false;
			}

			const upmarker = modal_component.querySelector(".vmap-icon-uploader");

			const upbuttons = upmarker.querySelectorAll( '.venomaps_marker_upload_btn' );
			const upimage = upmarker.querySelector( '.vmap-icon-image' );
			const defaultimage = upmarker.querySelector( '.vmap-icon-default' );
			const removemarkers = upmarker.querySelectorAll( '.venomaps_marker_remove_btn' );
			let get_target;

			var om_metaImageFrame;

			removemarkers.forEach(function(removemarker){
				removemarker.addEventListener("click", function(e){
					e.preventDefault();
					removemarker.classList.add("vmap-invisible");
					loadIconImage(upmarker, false);
					rowdata.icon = "";
				 	get_target = modal_component.dataset.rowTarget;
				 	updateRowData(get_target);
				});
			});

			upbuttons.forEach(function(upbutton){
				upbutton.addEventListener("click", function(e){
					e.preventDefault();
					om_metaImageFrame = wp.media.frames.om_metaImageFrame = wp.media();

					om_metaImageFrame.on("select", function(){
						var media_attachment = om_metaImageFrame.state().get('selection').first().toJSON();

						if (media_attachment.url) {
							loadIconImage(upmarker, media_attachment.url);
 							rowdata.icon = media_attachment.url;
						 	get_target = modal_component.dataset.rowTarget;
						 	updateRowData(get_target);
						}
					});

					om_metaImageFrame.open();
				});
			});

			// Update icon color
			const get_color = upmarker.querySelector( '.vmap-modal-get-color' );

			if (get_color) {
				get_color.addEventListener("input", function(){
					rowdata.color = get_color.value;
					updateIconStyle(modal_component);
				});	
			}

			// Update icon size
			const get_size = modal_component.querySelector(".vmap-modal-get-size");

			if (get_size) {
				get_size.addEventListener("input", function(){
					updateIconStyle(modal_component);
				});
			}
		}


		function fillModal(row){

			const dialog = document.querySelector("#vmap-modal");

			dialog.classList.add("active");

			const modal_component = dialog.querySelector(".vmap-modal-content");

			const rowindex = row.dataset.rowIndex;

			modal_component.dataset.index = rowindex;
			modal_component.dataset.rowTarget = row.id;

			const set_data = row.querySelector(".vmap-modal-set-data");
			rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);

			const get_size = modal_component.querySelector(".vmap-modal-get-size");
			const get_icon = modal_component.querySelector(".vmap-modal-get-icon");
			const get_color = modal_component.querySelector(".vmap-modal-get-color");
			const set_color = modal_component.querySelector(".vmap-modal-set-color");

			const get_infobox = modal_component.querySelector(".vmap-modal-get-infobox");
			const get_infobox_open = modal_component.querySelector(".vmap-modal-get-infobox-open");

			const get_header = modal_component.querySelector(".vmap-modal-title");

			const upmarker = modal_component.querySelector(".vmap-icon-uploader");

			get_size.value = rowdata.size;
			get_icon.value = rowdata.icon;
			get_color.value = rowdata.color;
			set_color.value = rowdata.color;
			get_infobox.value = rowdata.infobox;
			get_infobox_open.checked = rowdata.infobox_open == 1;

			get_header.innerHTML = "<span class=\"vmap-badge\">#" + rowindex + "</span> " + rowdata.title;

			loadIconImage(upmarker, rowdata.icon);
			updateIconStyle(modal_component);
		}

		/**
		 * Update input box with row data
		 **/
		function updateRowData(row_target){
			const row = document.getElementById(row_target);
			if (!row) {
				console.log('No Row found');
				return false;
			}
			const set_data = row.querySelector(".vmap-modal-set-data");
			set_data.value = JSON.stringify(rowdata);	
		}

		/**
		 * Update icon size and color
		 **/
		function updateIconStyle(modal_component){
			const upimage = modal_component.querySelector( '.vmap-icon-image' );
			const defaultimage = modal_component.querySelector( '.vmap-icon-default' );
			upimage.style.width = rowdata.size + "px";
			defaultimage.style.width = rowdata.size + "px";
			defaultimage.style.color = rowdata.color;
		}

		/**
		 * Init modal
		 **/
		function initModal(){

			const dialog = document.querySelector("#vmap-modal");

			if (!dialog) {
				console.log('No modal found');
				return false;
			}
			const modal_component = dialog.querySelector(".vmap-modal-content");

			const dismiss_modal = dialog.querySelectorAll(".vmap-modal-dismiss");
			dismiss_modal.forEach(function(modal_close){
				modal_close.addEventListener("click", function(e){
					dialog.classList.remove("active");
				});
			});

			const get_size = modal_component.querySelector('.vmap-modal-get-size' );
			const get_icon = modal_component.querySelector('.vmap-modal-get-icon' );
			const get_color = modal_component.querySelector('.vmap-modal-get-color' );
			const get_infobox = modal_component.querySelector(".vmap-modal-get-infobox");
			const get_infobox_open = modal_component.querySelector('.vmap-modal-get-infobox-open' );

			const set_color = modal_component.querySelector('.vmap-modal-set-color' );

			let get_target;

			get_color.addEventListener("change", function(){
			 	rowdata.color = get_color.value;
			 	set_color.value = get_color.value
			 	updateIconStyle(modal_component);
			 	get_target = modal_component.dataset.rowTarget;
			 	updateRowData(get_target);
			});

			set_color.addEventListener("change", function(){
				rowdata.color = set_color.value;
				get_color.value = set_color.value;
				updateIconStyle(modal_component);
				get_target = modal_component.dataset.rowTarget;
				updateRowData(get_target);
			});

			get_size.addEventListener("change", function(){
			 	rowdata.size = get_size.value;
			 	updateIconStyle(modal_component);
			 	get_target = modal_component.dataset.rowTarget;
			 	updateRowData(get_target);
			});

			get_infobox.addEventListener("change", function(){
			 	rowdata.infobox = get_infobox.value;
			 	get_target = modal_component.dataset.rowTarget;
			 	updateRowData(get_target);
			});

			get_infobox_open.addEventListener("change", function(){
				rowdata.infobox_open = get_infobox_open.checked;
			 	get_target = modal_component.dataset.rowTarget;
			 	updateRowData(get_target);
			});

			iconUploader(modal_component);
		}


		function initRow(row){
			const modal_component = document.querySelector("#vmap-modal .vmap-modal-content");
			const set_title = row.querySelector(".vmap-modal-set-title");
			const set_lat = row.querySelector(".vmap-modal-set-lat");
			const set_lon = row.querySelector(".vmap-modal-set-lon");

			if ( !modal_component || !set_title || !set_lat || !set_lon ) {
				console.log('Missing something...');
				return false;
			}

			const set_data = row.querySelector(".vmap-modal-set-data");
			// rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);

			// rowdata = JSON.parse(venomapsAdminVars.default_settings);

			const triggers = row.querySelectorAll(".vmap-edit-marker");
			const removeRows = row.querySelectorAll(".vmap-del-row");

			triggers.forEach(function(trigger){
				trigger.addEventListener("click", function(){
					fillModal(row);
				});
			});

			removeRows.forEach(function(removeRow){
				removeRow.addEventListener("click", function(){
					row.remove();
				});
			});

			set_title.addEventListener("input", function(){
				rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);
				rowdata.title = set_title.value;
			 	updateRowData(row.id);
			});
			set_lat.addEventListener("input", function(){
				rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);
				rowdata.lat = set_lat.value;
			 	updateRowData(row.id);
			});
			set_lon.addEventListener("input", function(){
				rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);
				rowdata.lon = set_lon.value;
			 	updateRowData(row.id);
			});
		}

		function initRows(){

			// Available markers
			const marker_rows = document.querySelectorAll(".vmap-marker-row");
			var master_row = marker_rows[0];

			if (!marker_rows || !master_row) {
				console.log('Missing marker_rows or master_row');
				return false;
			}

			marker_rows.forEach(function(row){
				initRow(row);
			});

			initRepeatable(master_row);
		}


		function initRepeatable(clonemaster){

			const row_container = document.querySelector(".vmap-wrap-rows");
			const newmarker_btn = document.querySelector(".wpol-new-marker");

			if (!clonemaster || !row_container) {
				console.log('Missing clonemaster or row_container');
				return false;
			}

			// Create clone
			newmarker_btn.addEventListener("click", function(){
				const cloneindex = row_container.lastElementChild ? row_container.lastElementChild.dataset.rowIndex : "1";
				const cloneindexold = clonemaster.dataset.rowIndex;
				const cloneindexnew = parseInt(cloneindex) + 1;
				const clone = clonemaster.cloneNode(true);

				clone.dataset.rowIndex = cloneindexnew;
				clone.id = "vmap-row-" + cloneindexnew;

				const vmap_badge = clone.querySelector(".vmap-badge-text");
				vmap_badge.innerText = cloneindexnew;

				// Update input data name
				const inputdata = clone.querySelector(".vmap-modal-set-data");
				inputdata.name = 'venomaps_data['+cloneindexnew+']';
				inputdata.value = "";

				// Reset inputs
				const cloneinputs = clone.querySelectorAll("input");
				cloneinputs.forEach(function(cloneinput){
					cloneinput.value = "";
				});

				row_container.append(clone);
				initRow(clone);
			});

		}


		function init() {

			initModal();

			initRows();

			loadGeolocator();

			loadPreviewMap();

			initSettingsPage();

			document.onkeydown = omDisableEnterKey;
		}

		function initSettingsPage() {
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
					var newitem = '<div class="wpol-repeatable-item wpol-form-group vmap-flex vmap-flex-collapse" data-number="'+newnum+'"><input type="text" class="all-options" name="venomaps_settings[style]['+newnum+'][name]" value="map style '+newnum+'"> <div class="vmap-flex-grow-1"><input type="url" class="large-text" name="venomaps_settings[style]['+newnum+'][url]" value="" placeholder="https://provider.ext/{z}/{x}/{y}.png?api_key=..."></div></div>';
					repeatablegroup.innerHTML += newitem;
				});

			});
		}


		function getStyleData(currentstyle) {
			const styles = JSON.parse(venomapsAdminVars.styles);
			var parts = currentstyle.split(/_(.*)/s);
			const stylegroup = parts[0];
			const stylemap = parts[1];		
			const url = styles[stylegroup].maps[stylemap].url;
			if (url) {
				return url;
			}
			return false;
		}

		function updateCenter(){

			const maplat = document.querySelector('input[name="venomaps_lat"]').value;
			const maplon = document.querySelector('input[name="venomaps_lon"]').value;
			if (maplat && maplon) {
				const coords = fromLonLat([ Number(maplon), Number(maplat) ]);
				preview_getview.animate({center: coords});
			}
		}

		function loadPreviewMap(){

			const styleSelector = document.querySelector('select[name="venomaps_style"]');

			if (!styleSelector) {
				console.log('Missing styleSelector');
				return false;
			}

			let defaultstyle = getStyleData(styleSelector.value);

			styleSelector.addEventListener('change', function(){
				const seturl = getStyleData(styleSelector.value);
				preview_getsource.setUrl(seturl);
			});

			const maplat = document.querySelector('input[name="venomaps_lat"]');
			const maplon = document.querySelector('input[name="venomaps_lon"]');

	        sourcesettings.url = defaultstyle;

            preview_getsource = new OSM(sourcesettings);

            var baselayer = new Tile({
                source: preview_getsource
            });

            preview_getview = new View({
                center: fromLonLat([ Number(maplon.value), Number(maplat.value) ]),
                zoom: 4
            });

            preview_map = new Map({
                target: 'preview-admin-map',
                view: preview_getview,
                layers: [
                    baselayer
                ],
                interactions: interactionDefaults({mouseWheelZoom:false})
            });

		    // Update lat lon fields
			preview_map.on('moveend', function () {
			  	const center = preview_getview.getCenter();
				var lonlat = toLonLat(center);
				maplat.value = lonlat[1];
				maplon.value = lonlat[0];
			});

			maplat.addEventListener('change', function(){
				updateCenter();
			});
			maplon.addEventListener('change', function(){
				updateCenter();
			});
		}

		/*
		 * Geolocation
		 */
		function loadGeolocator() {

			const geomap_id = "wpol-admin-map";
			const geomarker_id = "infomarker_admin";

			var timer;
			const adminmap = document.getElementById(geomap_id);
			const adminmarker = document.getElementById(geomarker_id);
			const latinput = document.querySelector(".venomaps-get-lat");
			const loninput = document.querySelector(".venomaps-get-lon");
			const responseinput = document.querySelector(".venomaps-response");
			const getcoords = document.querySelector(".venomaps-get-coordinates");

			if (!adminmap || !adminmarker || !latinput || !loninput || !responseinput || !getcoords) {
				console.log('Missing something...');
				return false;
			}

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

			getcoords.addEventListener("click", function(){
			// Get coordinates from Address.
				var button = getcoords;
				const address = document.querySelector(".venomaps-set-address").value;

				if ( address.length > 3 ) {
					getcoords.classList.add("vmap-hidden");
					var encoded = encodeURIComponent(address);
					var xhttp = new XMLHttpRequest();
					xhttp.open("GET", 'https://nominatim.openstreetmap.org/search?q='+encoded+'&format=json', true);

					xhttp.onload = () => {
						georesponse(JSON.parse(xhttp.response));
						getcoords.classList.remove("vmap-hidden");
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

		// jQuery(document).ready(function($){
		document.addEventListener("DOMContentLoaded", function(event) {
			init();
		});
}();
