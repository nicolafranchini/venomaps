import { Feature, Map, View, Overlay } from 'ol';
import { Point } from 'ol/geom';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { extend } from 'ol/extent';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Tile, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { defaults as interactionDefaults } from 'ol/interaction/defaults';
import { DragPan } from 'ol/interaction';
import { GeoJSON } from 'ol/format';
import { unByKey } from 'ol/Observable';

/*!
 * venomaps admin scripts
 */
const VenomapsAdmin = function(){
	'use strict';

	// Variabili globali del modulo
	let preview_map, preview_getview, preview_getsource;
	let previewMarkersLayer;
	let previewRouteLayer;
	let routeClickListenerKey;

	let sourcesettings = {};
	let rowdata = {};
	const defaultIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" fill="currentColor" viewBox="0 0 30 30" xml:space="preserve"><path d="M15,1C8.7,1,3.5,6.1,3.5,12.3S8.3,22.8,15,28.7c6.7-5.9,11.5-10.2,11.5-16.4S21.3,1,15,1z M15,17.2 c-2.5,0-4.6-2.1-4.6-4.6c0-2.5,2.1-4.6,4.6-4.6s4.6,2.1,4.6,4.6C19.6,15.1,17.5,17.2,15,17.2z"/></svg>';

	function init() {
	    initModal();
	    initRows();
	    loadGeolocator();
	    loadPreviewMap();
	    initSettingsPage();
	    initRoutesUI();
	    drawSavedRoutesOnLoad();
	    syncPreviewMarkers();
	    initFormValidation();
	    document.onkeydown = omDisableEnterKey;
	}

    // =======================================================
    // NUOVA SEZIONE: VALIDAZIONE DEL FORM PRIMA DEL SALVATAGGIO
    // =======================================================
	function validateRoutesBeforeSave() {
	    const allRouteRows = document.querySelectorAll('#vmap-routes-container .vmap-route-row');
	    let allRoutesAreValid = true;

	    allRouteRows.forEach(row => {
	        const stopsContainer = row.querySelector('.vmap-route-stops-select');
	        const geometryInput = row.querySelector('.vmap-route-geometry');
	        const status = row.querySelector('.vmap-route-status');

	        const stopsCount = stopsContainer ? stopsContainer.querySelectorAll('input[type="checkbox"]:checked').length : 0;
	        const hasGeometry = geometryInput && geometryInput.value.trim() !== '';

	        // Reset stile errore
	        row.classList.remove('invalid-route');
	        if (status) {
	            status.classList.remove('error-message');
	            // Non cancellare il testo se è un messaggio di successo
	            if (status.textContent.startsWith('ERROR:')) {
	                status.textContent = '';
	            }
	        }

	        // CONDIZIONE DI ERRORE: l'utente ha selezionato delle tappe ma non ha generato la geometria
	        if (stopsCount > 0 && !hasGeometry) {
	            allRoutesAreValid = false;
	            row.classList.add('invalid-route');
	            if (status) {
	                status.textContent = 'ERROR: Please click "Preview" to generate the route before saving.';
	                status.classList.add('error-message');
	            }
	        }
	    });
	    return allRoutesAreValid;
	}

    function initFormValidation() {
        const postForm = document.getElementById('post');
        if (postForm) {
            postForm.addEventListener('submit', function(event) {
                const routesAreValid = validateRoutesBeforeSave();
                if (!routesAreValid) {
                    event.preventDefault(); // Blocca il salvataggio
                    alert('There are incomplete routes. Please generate a preview for each route that has stops selected before saving the post.');
                    const firstError = document.querySelector('.invalid-route');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        }
    }
    
	function loadPreviewMap(){
		const styleSelector = document.querySelector('select[name="venomaps_style"]');
		if (!styleSelector) return;

		let defaultstyle = getStyleData(styleSelector.value);
		styleSelector.addEventListener('change', function(){
			const seturl = getStyleData(this.value);
			if (seturl) preview_getsource.setUrl(seturl);
		});

		const maplat = document.querySelector('input[name="venomaps_lat"]');
		const maplon = document.querySelector('input[name="venomaps_lon"]');
		sourcesettings.url = defaultstyle;
		preview_getsource = new OSM(sourcesettings);
		const baselayer = new Tile({ source: preview_getsource });
		preview_getview = new View({
			center: fromLonLat([ Number(maplon.value), Number(maplat.value) ]),
			zoom: 4
		});
		preview_map = new Map({
			target: 'preview-admin-map',
			view: preview_getview,
			layers: [ baselayer ],
			interactions: interactionDefaults({mouseWheelZoom:false})
		});
		preview_map.on('moveend', function () {
			const center = preview_getview.getCenter();
			const lonlat = toLonLat(center);
			maplat.value = lonlat[1];
			maplon.value = lonlat[0];
		});
		maplat.addEventListener('change', updateCenter);
		maplon.addEventListener('change', updateCenter);

	    const routeSource = new VectorSource();
	    previewRouteLayer = new VectorLayer({ source: routeSource, zIndex: 10 });
	    
	    const markersSource = new VectorSource();
	    previewMarkersLayer = new VectorLayer({ source: markersSource, zIndex: 11 });
	    
	    preview_map.addLayer(previewRouteLayer);
	    preview_map.addLayer(previewMarkersLayer);
	}

	function syncPreviewMarkers() {

	    if (!previewMarkersLayer) {
	        return;
	    }
	    const source = previewMarkersLayer.getSource();
	    source.clear();
	    const allMarkerRows = document.querySelectorAll('.vmap-wrap-rows .vmap-marker-row');

	    if (allMarkerRows.length === 0) {
	        return;
	    }

	    let markersDrawn = 0;
	    allMarkerRows.forEach((row, index) => {
	        const markerKey = row.dataset.markerKey;
	        const dataTextarea = row.querySelector('.vmap-modal-set-data');
	        const rawData = dataTextarea ? dataTextarea.value : null;

	        if (!rawData || rawData.trim() === '') {
	            return; // Salta questa iterazione
	        }

	        let data;
	        try {
	            data = JSON.parse(rawData);
	        } catch (e) {
	            console.error(`Riga #${index}: ERRORE nel parsing del JSON.`, e);
	            return; // Salta questa iterazione
	        }

	        if (data && data.lon && data.lat && data.lon.toString().trim() !== '' && data.lat.toString().trim() !== '') {
	            
	            const coordinates = fromLonLat([parseFloat(data.lon), parseFloat(data.lat)]);
	            const feature = new Feature({ geometry: new Point(coordinates) });
	            
	            const style = new Style({
	                image: new Circle({
	                    radius: 10,
	                    fill: new Fill({ color: 'rgba(255, 100, 50, 0.8)' }),
	                    stroke: new Stroke({ color: '#fff', width: 2 })
	                }),
	                text: new Text({
	                    text: (parseInt(markerKey, 10) + 1).toString(),
	                    fill: new Fill({ color: '#fff' }),
	                    font: 'bold 12px sans-serif'
	                })
	            });
	            feature.setStyle(style);
	            
	            source.addFeature(feature);
	            markersDrawn++;
	        } else {
	            console.warn(`Riga #${index}: Coordinate mancanti o non valide nei dati parsati.`);
	        }
	    });

	}

	function drawSavedRoutesOnLoad() {
	    setTimeout(() => {

	        if (!previewRouteLayer) {
	            return;
	        }
	        
	        const allRouteRows = document.querySelectorAll('#vmap-routes-container .vmap-route-row');
	        
	        const routeSource = previewRouteLayer.getSource();
	        routeSource.clear();

	        const format = new GeoJSON({
	            dataProjection: 'EPSG:4326',
	            featureProjection: 'EPSG:3857'
	        });
	        const routeColors = ['#0073aa', '#d9534f', '#5cb85c', '#f0ad4e'];
	        let featuresExist = false;

	        allRouteRows.forEach((row, index) => {
	            console.log(`--- Analizzando la riga di percorso #${index} ---`);
	            const geometryInput = row.querySelector('.vmap-route-geometry');
	            
	            if (geometryInput && geometryInput.value && geometryInput.value.trim() !== '') {
	                console.log(`Riga #${index}: Trovata geometria salvata.`);
	                try {
	                    const feature = format.readFeature(geometryInput.value);
	                    if (feature.getGeometry().getCoordinates().length > 0) {
	                        const style = new Style({
	                            stroke: new Stroke({
	                                color: routeColors[index % routeColors.length],
	                                width: 5,
	                                lineCap: 'round', lineJoin: 'round'
	                            })
	                        });
	                        feature.setStyle(style);
	                        routeSource.addFeature(feature);
	                        featuresExist = true;
	                        console.log(`Riga #${index}: Feature del percorso aggiunta con successo.`);
	                    }
	                } catch (e) {
	                    console.error(`Riga #${index}: ERRORE nel parsare la geometria salvata.`, e);
	                }
	            } else {
	                console.warn(`Riga #${index}: Nessuna geometria salvata trovata.`);
	            }
	        });
	        
	        const finalFeatureCount = routeSource.getFeatures().length;

	        if (featuresExist && finalFeatureCount > 0) {
	            const extent = routeSource.getExtent();
	            preview_map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 500, maxZoom: 16 });
	        } else {
	            console.warn("Nessuna feature valida da mostrare, lo zoom non viene eseguito.");
	        }
	        console.groupEnd();
	    }, 500);
	}

	function initRows(){
		const marker_rows = document.querySelectorAll(".vmap-marker-row");
		if (!marker_rows.length) return false;
		marker_rows.forEach(row => initRow(row));
		initRepeatable(marker_rows[0]);
	}

	function initRow(row) {
	    const set_title = row.querySelector(".vmap-modal-set-title");
	    const set_lat = row.querySelector(".vmap-modal-set-lat");
	    const set_lon = row.querySelector(".vmap-modal-set-lon");
	    const removeRows = row.querySelectorAll(".vmap-del-row");

	    row.querySelectorAll(".vmap-edit-marker").forEach(trigger => {
	        trigger.addEventListener("click", () => fillModal(row));
	    });

	    removeRows.forEach(removeRow => {
	        removeRow.addEventListener("click", () => {
	            row.remove();
	            updateAllRouteSelects();
	            syncPreviewMarkers();
	        });
	    });

	    // FUNZIONE UNICA PER GESTIRE OGNI CAMBIAMENTO
	    function handleInputChange() {
	        const set_data = row.querySelector(".vmap-modal-set-data");
	        let currentData;
	        try {
	            currentData = set_data.value ? JSON.parse(set_data.value) : {};
	        } catch (e) {
	            currentData = {}; // Inizia da un oggetto vuoto se il JSON non è valido
	        }

	        // Aggiorna l'oggetto dati con i valori correnti degli input
	        currentData.title = set_title.value;
	        currentData.lat = set_lat.value;
	        currentData.lon = set_lon.value;
	        
	        // Risalva la stringa JSON nel textarea
	        set_data.value = JSON.stringify(currentData);

	        // Aggiorna l'interfaccia
	        updateAllRouteSelects(); // Necessario per aggiornare il titolo nei select
	        syncPreviewMarkers();   // Ridisegna TUTTI i marker sulla mappa
	    }

	    // Applica lo stesso handler a tutti gli input
	    if(set_title) set_title.addEventListener('input', handleInputChange);
	    if(set_lat) set_lat.addEventListener("input", handleInputChange);
	    if(set_lon) set_lon.addEventListener("input", handleInputChange);
	}

	function updateAllRouteSelects() {
	    const allMarkerRows = document.querySelectorAll('.vmap-wrap-rows .vmap-marker-row');
	    const allRouteStopsContainers = document.querySelectorAll('#vmap-routes-container .vmap-route-stops-select');

	    if (allRouteStopsContainers.length === 0) return;

	    // 1. Raccogli i dati di tutti i marker disponibili
	    const markerOptions = [];
	    allMarkerRows.forEach(row => {
	        const key = row.dataset.markerKey;
	        const titleInput = row.querySelector('.vmap-modal-set-title');
	        const title = titleInput && titleInput.value ? titleInput.value : `Marker #${parseInt(key, 10) + 1}`;
	        markerOptions.push({ value: key, text: title });
	    });

	    // 2. Itera su ogni contenitore di checkbox (per ogni rotta) e aggiornalo
	    allRouteStopsContainers.forEach(container => {
	        // Salva i valori attualmente selezionati
	        const checkedValues = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
	        
	        // Svuota il contenitore
	        container.innerHTML = '';

	        // Ricostruisci la lista di checkbox
	        const parentRow = container.closest('.vmap-route-row');
	        const routeIndex = parentRow ? parentRow.dataset.index : '0';

	        markerOptions.forEach(opt => {
	            const label = document.createElement('label');
	            const checkbox = document.createElement('input');
	            
	            checkbox.type = 'checkbox';
	            checkbox.value = opt.value;
	            checkbox.name = `venomaps_routes[${routeIndex}][stops][]`;

	            if (checkedValues.includes(opt.value)) {
	                checkbox.checked = true;
	            }

	            label.appendChild(checkbox);
	            label.appendChild(document.createTextNode(` ${opt.text}`));
	            container.appendChild(label);
	        });
	    });
	}

	function initRoutesUI() {
		const container = document.getElementById('vmap-routes-container');
		if (!container) return;

		container.addEventListener('click', async function(e) {
		    const previewBtn = e.target.closest('.vmap-preview-route');
		    const deleteBtn = e.target.closest('.vmap-del-route');
		    const addBtn = e.target.closest('#vmap-add-route');

		    if (previewBtn) {
		        e.preventDefault();
		        previewBtn.disabled = true;
		        previewBtn.textContent = 'Loading...';
		        const routeRow = previewBtn.closest('.vmap-route-row');
		        const stopsContainer = routeRow.querySelector('.vmap-route-stops-select');
		        
		        const selectedCheckboxes = stopsContainer.querySelectorAll('input[type="checkbox"]:checked');
		        const selectedMarkerIndexes = Array.from(selectedCheckboxes).map(cb => cb.value);

		        if (selectedMarkerIndexes.length < 2) {
		            alert('Please select at least two stops.');
		            previewBtn.disabled = false;
		            previewBtn.textContent = 'Preview';
		            return;
		        }

		        const allMarkerRows = document.querySelectorAll('.vmap-wrap-rows .vmap-marker-row');
		        const markerDataMap = {};
		        allMarkerRows.forEach(row => {
		            const key = row.dataset.markerKey;
		            try {
		                const data = JSON.parse(row.querySelector('.vmap-modal-set-data').value);
		                if (data && data.lon && data.lat) {
		                    markerDataMap[key] = { lon: data.lon, lat: data.lat };
		                }
		            } catch (e) {}
		        });

		        const orderedCoords = selectedMarkerIndexes
		            .map(index => {
		                const marker = markerDataMap[index];
		                if (marker) return `${marker.lon},${marker.lat}`;
		                return null;
		            })
		            .filter(coord => coord !== null);

		        const coordsString = orderedCoords.join(';');
		        if (orderedCoords.length < 2) {
		            alert('The selected stops do not have valid coordinates. Please check each selected marker.');
		            previewBtn.disabled = false;
		            previewBtn.textContent = 'Preview';
		            return;
		        }

		        const bodyParams = new URLSearchParams();
		        bodyParams.append("action", "vmap_fetch_osrm_routes");
		        bodyParams.append("nonce", venomapsAdminVars.nonce);
		        bodyParams.append("coords", coordsString);

		        try {
		            const response = await fetch(venomapsAdminVars.ajax_url, {
		                method: 'POST',
		                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		                body: bodyParams
		            });
		            const result = await response.json();
		            if (result.success) {
		                drawRoutePreviews(result.data, routeRow);
		            } else {
		                alert('Error fetching route: ' + result.data);
		            }
		        } catch (error) {
		            console.error('AJAX Error:', error);
		            alert('An error occurred while fetching the route.');
		        } finally {
		            previewBtn.disabled = false;
		            previewBtn.textContent = 'Preview';
		        }
		    }

		    if (deleteBtn) {
		        deleteBtn.closest('.vmap-route-row').remove();
		        // updateAllRouteSelects();
		        // syncPreviewMarkers();
		        drawSavedRoutesOnLoad(); 
		    }

		    if (addBtn) {
		        const list = container.querySelector('.vmap-routes-list');
		        const template = container.querySelector('#vmap-route-template');

		        let nextIndex = 0;
		        const allRows = list.querySelectorAll('.vmap-route-row');
		        if (allRows.length > 0) {
		            const lastRow = allRows[allRows.length - 1];
		            nextIndex = parseInt(lastRow.dataset.index, 10) + 1;
		        }
		        const newNum = nextIndex + 1;

		        const newRow = template.querySelector('.vmap-route-row').cloneNode(true);
		        newRow.id = `vmap-route-row-${nextIndex}`;
		        newRow.dataset.index = nextIndex;

		        const strongEl = newRow.querySelector('strong');
		        strongEl.textContent = strongEl.textContent.replace('#__NUM__', `#${newNum}`);

		        // Aggiorna i nomi degli input
		        const geometryInput = newRow.querySelector('.vmap-route-geometry');
		        if (geometryInput) geometryInput.name = `venomaps_routes[${nextIndex}][geometry]`;
		        
		        // Aggiorna il contenitore delle checkbox, svuotandolo e ripopolandolo
		        const stopsContainer = newRow.querySelector('.vmap-route-stops-select');
		        if (stopsContainer) {
		             stopsContainer.innerHTML = 'No markers available yet.'; // Messaggio temporaneo
		        }

		        list.appendChild(newRow);
		        
		        // Aggiorna tutti i contenitori per aggiungere le opzioni alla nuova riga
		        updateAllRouteSelects();
		    }
		});
	}

	function drawRoutePreviews(routes, targetRow) {
	    if (!previewRouteLayer) return;
	    const routeSource = previewRouteLayer.getSource();
	    routeSource.clear();

	    if (routeClickListenerKey) {
	        unByKey(routeClickListenerKey);
	        routeClickListenerKey = null;
	    }
	    
	    const format = new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
	    const primaryStyle = new Style({ stroke: new Stroke({ color: '#0073aa', width: 6, lineCap: 'round', lineJoin: 'round' }) });
	    const alternativeStyle = new Style({ stroke: new Stroke({ color: '#888', width: 4, lineCap: 'round', lineJoin: 'round' }) });
	    
	    // 1. Disegna tutte le rotte e assegna loro lo stile alternativo di default
	    routes.forEach((route) => {
	        const feature = format.readFeature(route.geometry);
	        feature.set('full_route_data', route);
	        feature.set('is_preview', true);
	        feature.set('targetRowId', targetRow.id);
	        feature.setStyle(alternativeStyle); // Iniziano tutte come alternative
	        routeSource.addFeature(feature);
	    });

	    // 2. Determina quale feature deve essere quella "attiva" (primaria)
	    const savedGeometryValue = targetRow.querySelector('.vmap-route-geometry').value;
	    let activeFeature = routeSource.getFeatures()[0] || null; // Default alla prima se non troviamo altro

	    if (savedGeometryValue) {
	        try {
	            // Confronta la geometria salvata con quelle nuove
	            const savedGeomString = JSON.stringify(JSON.parse(savedGeometryValue));
	            for (const feature of routeSource.getFeatures()) {
	                const featureGeomString = JSON.stringify(format.writeGeometryObject(feature.getGeometry()));
	                if (featureGeomString === savedGeomString) {
	                    activeFeature = feature; // Trovata! Questa è la nostra feature attiva
	                    break;
	                }
	            }
	        } catch(e) { /* Ignora errori */ }
	    }
	    
	    // 3. Applica lo stile primario alla feature attiva e salva i suoi dati
	    if (activeFeature) {
	        activeFeature.setStyle(primaryStyle);
	        const activeGeometry = format.writeGeometryObject(activeFeature.getGeometry());
	        targetRow.querySelector('.vmap-route-geometry').value = JSON.stringify(activeGeometry);
	        targetRow.querySelector('.vmap-route-status').textContent = 'Route selected. Click an alternative to change.';
	    }

	    // 4. Zoom e listener
	    const fullExtent = previewMarkersLayer.getSource().getExtent();
		extend(fullExtent, routeSource.getExtent());
	    preview_map.getView().fit(fullExtent, { padding: [40, 40, 40, 40], duration: 500, maxZoom: 16 });
	    
	    routeClickListenerKey = preview_map.on('singleclick', function(e) {
	        const clickedFeature = preview_map.forEachFeatureAtPixel(e.pixel, function(f) {
	            if (f.get('is_preview')) return f;
	        });

	        if (clickedFeature) {
	            const geometryJson = JSON.stringify(format.writeGeometryObject(clickedFeature.getGeometry()));
	            document.getElementById(clickedFeature.get('targetRowId')).querySelector('.vmap-route-geometry').value = geometryJson;
	            
	            routeSource.getFeatures().forEach(f => {
	                f.setStyle(f === clickedFeature ? primaryStyle : alternativeStyle);
	            });
	        }
	    });
	}

    // Qui inserisci tutte le altre funzioni che hai dato prima, da `upFile` a `omDisableEnterKey`.
    // Sono corrette e non serve modificarle. Per brevità non le ripeto.
	function upFile(component){
		const upbutton = component.querySelector( '.vmap-set-uploader' );
		const field = component.querySelector( '.vmap-get-uploader' );
		const processCsvBtn = component.querySelector(".vmap-import-csv");
		const post_id = field.dataset.postId;
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
		if (processCsvBtn && post_id) {
			processCsvBtn.addEventListener("click", function(e){
				e.preventDefault();
				const data = {};
				data.url = field.value;
				data.id = post_id;
				sendCsvData(data, component);
			});
		}	
	}

	const allUploaders = document.querySelectorAll(".vmap-uploader");
	allUploaders.forEach(function(component){ upFile(component); });

	function sendCsvData(data, component) {
		const spinner = component.querySelector(".spinner");
		const processCsvBtn = component.querySelector(".vmap-import-csv");
		const responseMsg = component.querySelector(".vmap-response-message");
		const delimiter = component.querySelector('input[name="csv_delimiter"]:checked');
		responseMsg.classList.remove("active");
		spinner.classList.add("is-active");
		processCsvBtn.classList.add("vmap-hidden");
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4) {
				if (xhttp.status == 200) {
					const response_obj = JSON.parse(xhttp.response);
					responseMsg.innerText = response_obj;
					responseMsg.classList.add("active");
				}
				spinner.classList.remove("is-active");
			}
		};
		const formData = new FormData();
		formData.append("action", "vmap_set_csv");
		formData.append("vmap_nonce", venomapsAdminVars.nonce);
		formData.append("url", data.url);
		formData.append("post_id", data.id);
		formData.append("delimiter", delimiter.value);
		xhttp.open("POST", venomapsAdminVars.ajax_url, true);
		xhttp.send(formData);
	}

	function loadIconImage(upmarker, url = false) {
		const field = upmarker.querySelector( '.vmap-modal-get-icon' );
		const upimage = upmarker.querySelector( '.vmap-icon-image' );
		const defaultimage = upmarker.querySelector( '.vmap-icon-default' );
		const removemarkers = upmarker.querySelectorAll( '.venomaps_marker_remove_btn' );
		const color_component = upmarker.querySelector(".vmap-color-component");
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
					color_component.classList.add("vmap-hidden");
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
				color_component.classList.remove("vmap-hidden");
			});
		}
	}

	function iconUploader(modal_component){
		if (!modal_component) return false;
		const upmarker = modal_component.querySelector(".vmap-icon-uploader");
		const upbuttons = upmarker.querySelectorAll( '.venomaps_marker_upload_btn' );
		const removemarkers = upmarker.querySelectorAll( '.venomaps_marker_remove_btn' );
		const color_component = modal_component.querySelector(".vmap-color-component");
		let get_target;
		var om_metaImageFrame;
		removemarkers.forEach(function(removemarker){
			removemarker.addEventListener("click", function(e){
				e.preventDefault();
				removemarker.classList.add("vmap-invisible");
				color_component.classList.remove("vmap-hidden");
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
		const get_color = upmarker.querySelector( '.vmap-modal-get-color' );
		if (get_color) {
			get_color.addEventListener("input", function(){
				rowdata.color = get_color.value;
				updateIconStyle(modal_component);
			});	
		}
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

		// const rowindex = row.dataset.rowIndex;
		// modal_component.dataset.index = rowindex;
		modal_component.dataset.rowTarget = row.id;
		const set_data = row.querySelector(".vmap-modal-set-data");
		rowdata = set_data.value ? JSON.parse(set_data.value) : JSON.parse(venomapsAdminVars.default_settings);
		
		const rowindex = rowdata.key;
		modal_component.dataset.index = rowindex;

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
		get_header.innerHTML = `<span class="vmap-badge">#${rowindex}</span> ${rowdata.title}`;
		loadIconImage(upmarker, rowdata.icon);
		updateIconStyle(modal_component);
	}
	
	function updateRowData(row_target){
		const row = document.getElementById(row_target);
		if (!row) return false;
		const set_data = row.querySelector(".vmap-modal-set-data");
		set_data.value = JSON.stringify(rowdata);	
	}

	function updateIconStyle(modal_component){
		const upimage = modal_component.querySelector( '.vmap-icon-image' );
		const defaultimage = modal_component.querySelector( '.vmap-icon-default' );
		upimage.style.width = rowdata.size + "px";
		defaultimage.style.width = rowdata.size + "px";
		defaultimage.style.color = rowdata.color;
	}

	function initModal(){
		const dialog = document.querySelector("#vmap-modal");
		if (!dialog) return false;
		const modal_component = dialog.querySelector(".vmap-modal-content");
		const dismiss_modal = dialog.querySelectorAll(".vmap-modal-dismiss");
		dismiss_modal.forEach(modal_close => {
			modal_close.addEventListener("click", () => dialog.classList.remove("active"));
		});
		const get_size = modal_component.querySelector('.vmap-modal-get-size' );
		const get_color = modal_component.querySelector('.vmap-modal-get-color' );
		const get_infobox = modal_component.querySelector(".vmap-modal-get-infobox");
		const get_infobox_open = modal_component.querySelector('.vmap-modal-get-infobox-open' );
		const set_color = modal_component.querySelector('.vmap-modal-set-color' );
		let get_target;
		get_color.addEventListener("change", function(){
			rowdata.color = get_color.value;
			set_color.value = get_color.value;
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

	function initRepeatable(clonemaster) {
	    const row_container = document.querySelector(".vmap-wrap-rows");
	    const newmarker_btn = document.querySelector(".wpol-new-marker");

	    if (!clonemaster || !row_container || !newmarker_btn) return false;

	    newmarker_btn.addEventListener("click", function() {
	        const allRows = row_container.querySelectorAll('.vmap-marker-row');
	        let maxKey = -1;
	        allRows.forEach(r => {
	            const key = parseInt(r.dataset.markerKey, 10);
	            if (key > maxKey) maxKey = key;
	        });
	        const newKey = maxKey + 1;
	        const clone = clonemaster.cloneNode(true);
	        clone.dataset.markerKey = newKey;
	        clone.id = `vmap-row-${newKey}`;
	        clone.querySelector(".vmap-badge-text").innerText = newKey + 1;

	        const inputdata = clone.querySelector(".vmap-modal-set-data");
	        inputdata.name = `venomaps_data[${newKey}]`;
	        
	        // CORREZIONE: Inizializza con un JSON valido ma vuoto
	        let newMarkerData = JSON.parse(venomapsAdminVars.default_settings);
	        newMarkerData.lat = '';
	        newMarkerData.lon = '';
	        newMarkerData.title = '';
	        newMarkerData.key = newKey + 1;
	        inputdata.value = JSON.stringify(newMarkerData);
	        
	        clone.querySelectorAll("input[type='text']").forEach(input => {
	            input.value = "";
	        });

	        row_container.append(clone);
	        initRow(clone);
	        updateAllRouteSelects();
	        syncPreviewMarkers();
	    });
	}


	function initSettingsPage() {
		const repeatablegroup = document.querySelector(".wpol-repeatable-group");
		const callrepeatables = document.querySelectorAll(".wpol-call-repeat");
		if (!repeatablegroup || !callrepeatables.length) return;
		callrepeatables.forEach(callrepeatable => {
			callrepeatable.addEventListener("click", function(){
				const lastItem = repeatablegroup.querySelector(".wpol-repeatable-item:last-child");
				const lastitemnum = lastItem ? lastItem.dataset.number : -1;
				const newnum = parseFloat(lastitemnum) + 1;
				const newItemHtml = `<div class="wpol-repeatable-item wpol-form-group vmap-flex vmap-flex-collapse" data-number="${newnum}"><input type="text" class="all-options" name="venomaps_settings[style][${newnum}][name]" value="map style ${newnum}"> <div class="vmap-flex-grow-1"><input type="url" class="large-text" name="venomaps_settings[style][${newnum}][url]" value="" placeholder="https://provider.ext/{z}/{x}/{y}.png?api_key=..."></div></div>`;
				repeatablegroup.insertAdjacentHTML('beforeend', newItemHtml);
			});
		});
	}

	function getStyleData(currentstyle) {
		const styles = JSON.parse(venomapsAdminVars.styles);
		var parts = currentstyle.split(/_(.*)/s);
		const stylegroup = parts[0];
		const stylemap = parts[1];
		if (styles[stylegroup] && styles[stylegroup].maps[stylemap]) {
			return styles[stylegroup].maps[stylemap].url;
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

	function loadGeolocator() {
		const geomarker_id = "infomarker_admin";
		const latinput = document.querySelector(".venomaps-get-lat");
		const loninput = document.querySelector(".venomaps-get-lon");
		const responseinput = document.querySelector(".venomaps-response");
		const getcoords = document.querySelector(".venomaps-get-coordinates");
		if (!latinput || !loninput || !responseinput || !getcoords) return;

		var om_map_pos = fromLonLat([-74.005974, 40.712776]);
		var view = new View({ center: om_map_pos, zoom: 2 });
		var map = new Map({
			target: 'wpol-admin-map',
			view: view,
			layers: [ new Tile({ source: new OSM() }) ],
			interactions: interactionDefaults({mouseWheelZoom:false})
		});
		var marker_el = document.getElementById(geomarker_id);
		var infomarker = new Overlay({
			position: om_map_pos,
			positioning: 'center-center',
			element: marker_el,
			stopEvent: false
		});
		map.addOverlay(infomarker);
		var dragPan;
		map.getInteractions().forEach(interaction => {
			if (interaction instanceof DragPan) dragPan = interaction;
		});
		marker_el.addEventListener('mousedown', () => {
			dragPan.setActive(false);
			infomarker.set('dragging', true);
		});
		map.on("pointermove", (evt) => {
			if (infomarker.get('dragging')) infomarker.setPosition(evt.coordinate);
		});
		map.on("pointerup", (evt) => {
			if (infomarker.get('dragging')) {
				dragPan.setActive(true);
				infomarker.set('dragging', false);
				var lonlat = toLonLat(evt.coordinate);
				latinput.value = lonlat[1];
				loninput.value = lonlat[0];
			}
		});
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
				lat = ''; lon = '';
				responseinput.innerHTML = "Nothing Found";
			}
			latinput.value = lat;
			loninput.value = lon;
		}
		getcoords.addEventListener("click", function(){
			const address = document.querySelector(".venomaps-set-address").value;
			if (address.length > 3) {
				getcoords.classList.add("vmap-hidden");
				var encoded = encodeURIComponent(address);
				fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json`)
					.then(response => response.json())
					.then(data => {
						georesponse(data);
						getcoords.classList.remove("vmap-hidden");
					});
			}
		});
	}

	function omDisableEnterKey(evt) {
		var elem = evt.target;
		if (evt.keyCode === 13 && (elem.type =='text' || elem.type =='url' || elem.type =='number')) {
			evt.preventDefault();
			return false;
		}
	}

	document.addEventListener("DOMContentLoaded", init);
}();
