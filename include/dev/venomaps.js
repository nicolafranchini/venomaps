import {Map, View, Overlay, Feature} from 'ol';
import { fromLonLat } from 'ol/proj';
import { Point, LineString } from 'ol/geom';
import { Style, Icon, Circle, Fill, Stroke, Text } from 'ol/style';
import { Vector as VectorSource, Cluster, OSM} from 'ol/source';
import { asArray } from 'ol/color';
import { Vector as VectorLayer, Tile } from 'ol/layer';
import { defaults as controlDefaults } from 'ol/control/defaults';
import { FullScreen } from 'ol/control';
import { defaults as interactionDefaults } from 'ol/interaction/defaults';
import { GeoJSON } from 'ol/format';
import { createEmpty, extend } from 'ol/extent';

(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VenoMaps = factory());
}(self, (function () { 'use strict';

    var VenoMapsPlugin = (function(){

        function initVenoMaps(mapblock){
            const infomap = JSON.parse(mapblock.dataset.infomap);
            const { mapid, lat: maplat, lon: maplon, zoom, cluster_color, cluster_bg, destination, routes } = infomap;
            const styleUrl = decodeURIComponent(infomap.style_url);
            const routeColors = ['#009CD7', '#FF6347', '#32CD32', '#FFD700', '#DA70D6', '#1E90FF'];
            
            let map; // Sarà definita in loadMap
            let routeInfoOverlay = null; // Aggiungi questa riga

            // SOURCE
            const markersSource = new VectorSource();
            const savedRoutesSource = new VectorSource();
            const geolocationRouteSource = new VectorSource(); // Aggiunto per completezza
            const clusterSource = new Cluster({ distance: 50, minDistance: 20, source: markersSource });
            
            // LAYER
            const savedRoutesLayer = new VectorLayer({ source: savedRoutesSource, zIndex: 5 });
            const geolocationRouteLayer = new VectorLayer({ source: geolocationRouteSource, zIndex: 6 });
            const clusterLayer = new VectorLayer({
                source: clusterSource,
                zIndex: 10,
                style: function(feature) {
                    const clusterMembers = feature.get('features').filter(f => f.get('is_matching_search') !== false);
                    const size = clusterMembers.length;
                    if (size === 0) return null;
                    feature.get('features').forEach(f => closepanels(f.get('panel')));
                    if (size > 1) {
                        const cluster_bg_array = asArray(cluster_bg).slice();
                        cluster_bg_array[3] = 0.3;
                        const radius = Math.min(parseInt(Math.sqrt(size) + 16), 25);
                        return [
                            new Style({ image: new Circle({ radius: (7 + radius), fill: new Fill({ color: cluster_bg_array }) }) }),
                            new Style({
                                image: new Circle({ radius: radius, stroke: new Stroke({ color: cluster_color }), fill: new Fill({ color: cluster_bg }) }),
                                text: new Text({ text: size.toString(), fill: new Fill({ color: cluster_color }), font: "12px sans-serif" })
                            })
                        ];
                    } else {
                        const originalFeature = clusterMembers[0];
                        openpanels(originalFeature.get('panel'));
                        return originalFeature.get('stile');
                    }
                }
            });

            // STILI
            const primaryRouteStyle = new Style({ stroke: new Stroke({ color: '#009CD7', width: 7, lineCap: 'round' }) });
            const alternativeRouteStyle = new Style({ stroke: new Stroke({ color: '#86B9D4', width: 5, lineCap: 'round' }) });

            function closepanels(thispanel = false){
                if (thispanel) {
                    if (!thispanel.classList.contains('infobox-closed')) {
                        thispanel.classList.add('was-open', 'infobox-closed');
                    }
                }
            }

            function openpanels(thispanel = false){
                if (thispanel) {
                    if (thispanel.classList.contains('was-open')) {
                        thispanel.classList.remove('infobox-closed');
                    }
                }
            }

            /**
             * Converte un oggetto maneuver di OSRM in una stringa leggibile in italiano.
             * @param {object} maneuver L'oggetto maneuver dallo step del percorso.
             * @returns {string} L'istruzione testuale.
             */
            function buildInstruction(maneuver) {
                let instruction = '';
                const type = maneuver.type;
                const modifier = maneuver.modifier;

                switch (type) {
                    case 'depart':
                        instruction = 'Parti';
                        break;
                    case 'arrive':
                        instruction = 'Sei arrivato a destinazione';
                        break;
                    case 'merge':
                        instruction = 'Immettiti';
                        break;
                    case 'turn':
                    case 'fork':
                    case 'end of road':
                        switch (modifier) {
                            case 'right': instruction = 'Gira a destra'; break;
                            case 'left': instruction = 'Gira a sinistra'; break;
                            case 'slight right': instruction = 'Svolta leggermente a destra'; break;
                            case 'slight left': instruction = 'Svolta leggermente a sinistra'; break;
                            case 'sharp right': instruction = 'Svolta a gomito a destra'; break;
                            case 'sharp left': instruction = 'Svolta a gomito a sinistra'; break;
                            case 'straight': instruction = 'Continua dritto'; break;
                            case 'uturn': instruction = 'Fai un\'inversione a U'; break;
                        }
                        if (type === 'fork') instruction = instruction.replace('Gira', 'Tieni');
                        break;
                    case 'new name':
                        instruction = 'Continua dritto';
                        break;
                    case 'continue':
                        instruction = `Continua su ${modifier}`;
                        break;
                    case 'roundabout':
                        instruction = `Alla rotonda, prendi la ${maneuver.exit}ª uscita`;
                        break;
                    case 'rotary':
                         instruction = `Entra nella rotatoria e prendi la ${maneuver.exit}ª uscita`;
                        break;
                    default:
                        // Fallback per tipi non gestiti
                        instruction = `${type} ${modifier || ''}`;
                        break;
                }
                return instruction.charAt(0).toUpperCase() + instruction.slice(1); // Metti la prima lettera maiuscola
            }

            /**
             * Stampa le indicazioni di un percorso nella console.
             * @param {object} route L'oggetto percorso restituito da OSRM.
             */
            function logDirections(route, title = 'Indicazioni') {
                if (!route || !route.legs) return;
                console.clear();
                const duration = Math.round(route.duration / 60);
                const distance = (route.distance / 1000).toFixed(2);
                console.log(`%c--- ${title} (Durata: ${duration} min, Distanza: ${distance} km) ---`, 'color: #009CD7; font-weight: bold; font-size: 14px;');
                const steps = route.legs[0].steps;
                steps.forEach((step, index) => {
                    const stepDistance = (step.distance / 1000).toFixed(2);
                    const streetName = step.name ? `su ${step.name}` : '';
                    const instructionText = buildInstruction(step.maneuver);
                    console.log(`${index + 1}. ${instructionText} ${streetName} (per ${stepDistance} km)`);
                });
                console.log(`%c--- Fine Indicazioni ---`, 'color: #009CD7; font-weight: bold; font-size: 14px;');
            }


           function setUpData() {
                const wrapoverlay = mapblock.querySelector('#wrap-overlay-' + mapid);
                const allinfomarkers = wrapoverlay.querySelectorAll(".wpol-infomarker");
                const features = [];
                const overlays = [];

                allinfomarkers.forEach(function(infomarkerdom, key) {
                    const datamarker = JSON.parse(infomarkerdom.dataset.marker);
                    if (!datamarker.lon || !datamarker.lat) return;
                    
                    const lonLatCoords = [parseFloat(datamarker.lon), parseFloat(datamarker.lat)];
                    const feature = new Feature(new Point(fromLonLat(lonLatCoords)));
                    
                    const markerint = parseFloat(datamarker.size);
                    feature.set('stile', new Style({
                        image: new Icon({
                            src: infomarkerdom.querySelector('img').src,
                            height: markerint,
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            crossOrigin: "anonymous"
                        })
                    }));
                    
                    const labelDom = document.getElementById('infopanel_' + mapid + '_' + key);
                    if (labelDom) {

                        const closeButton = labelDom.querySelector('.wpol-infopanel-close');
                        if (closeButton) {
                            closeButton.addEventListener('click', function(e) {
                                // Ferma la propagazione per evitare che il click sulla mappa apra un altro pannello
                                e.stopPropagation(); 
                                labelDom.classList.add('infobox-closed');
                                labelDom.classList.remove('was-open'); 
                            });
                        }

                        overlays.push(new Overlay({
                            position: fromLonLat(lonLatCoords),
                            positioning: 'bottom-center',
                            offset: [0, -(markerint + 12)],
                            element: labelDom,
                        }));
                        feature.set('panel', labelDom);
                    }
                    features.push(feature);
                });

                markersSource.addFeatures(features);
                
                // Disegna i percorsi salvati
                // drawSavedRoutes();

                // Ritorna gli overlay per aggiungerli alla mappa
                return overlays;
            }

            function drawSavedRoutes() {
                if (!routes || routes.length === 0) {
                    return;
                }
                
                const format = new GeoJSON({
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });

                routes.forEach((routeData, index) => {
                    if (!routeData.geometry) {
                        console.warn(`Percorso #${index}: Chiave 'geometry' mancante, percorso saltato.`);
                        return;
                    }
                    
                    try {
                        const feature = format.readFeature(routeData.geometry);
                        if (feature && feature.getGeometry()) {
                            feature.set('route_data', routeData);
                            // feature.set('route_title', `Percorso ${index + 1}`);
                            feature.set('route_title', routeData.title);
                            feature.setStyle(new Style({
                                stroke: new Stroke({
                                    color: routeColors[index % routeColors.length],
                                    width: 6, lineCap: 'round', lineJoin: 'round'
                                })
                            }));
                            savedRoutesSource.addFeature(feature);
                        } else {
                             console.error(`Percorso #${index}: Errore: la geometria non è valida per OpenLayers.`);
                        }
                    } catch(e) {
                        console.error(`Percorso #${index}: Errore CRITICO nel parsing della geometria.`, e);
                    }
                });
            }

            function updateSearch(term) {
                const searchTerm = term.toLowerCase();
                let featuresToShow = [];

                // 1. Itera su tutte le feature originali nel markersSource
                markersSource.forEachFeature(function(feature) {
                    const panel = feature.get('panel');
                    let isVisible = true; // Di default, tutti i marker sono visibili

                    if (searchTerm.length > 2) {
                        const infoboxText = panel?.querySelector('.wpol-infolabel')?.innerText.toLowerCase() || '';
                        if (infoboxText.includes(searchTerm)) {
                            isVisible = true;
                            featuresToShow.push(feature);
                        } else {
                            isVisible = false;
                        }
                    }
                    // Applica la proprietà custom. Usiamo un nome diverso da 'visible' per evitare conflitti.
                    feature.set('is_matching_search', isVisible);
                });

                // 2. Forza il layer dei cluster a ridisegnarsi
                clusterLayer.getSource().refresh();

                // 3. Se c'è un termine di ricerca e abbiamo trovato risultati, fai lo zoom
                if (searchTerm.length > 2 && featuresToShow.length > 0) {
                    const tempSource = new VectorSource({ features: featuresToShow });
                    map.getView().fit(tempSource.getExtent(), {
                        duration: 500,
                        padding: [100, 100, 100, 100],
                        maxZoom: 15
                    });
                }
            }

            /**
             * Ottiene la posizione dell'utente e calcola i percorsi tramite OSRM.
             */
            async function getDirections() {
                if (!('geolocation' in navigator)) { return; }
                const button = document.getElementById('get-directions-' + mapid);
                button.disabled = true;
                button.textContent = 'Trovo la posizione...';

                navigator.geolocation.getCurrentPosition(async (position) => {
                    geolocationRouteSource.clear();

                    const userLon = position.coords.longitude;
                    const userLat = position.coords.latitude;
                    const userMarker = new Feature({ geometry: new Point(fromLonLat([userLon, userLat])) });
                    userMarker.setStyle(new Style({ image: new Circle({ radius: 8, fill: new Fill({ color: '#2a6fdb' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }) }));
                    geolocationRouteSource.addFeature(userMarker); // CORRETTO
                    
                    button.textContent = 'Calcolo il percorso...';
                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

                    try {
                        const response = await fetch(osrmUrl);
                        const data = await response.json();
                        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) throw new Error('Nessun percorso trovato.');

                        data.routes.forEach((route, index) => {
                            const routeGeometry = new LineString(route.geometry.coordinates).transform('EPSG:4326', 'EPSG:3857');
                            const routeFeature = new Feature({ geometry: routeGeometry });
                            routeFeature.set('route_data', route);
                            routeFeature.set('is_geolocation_route', true);
                            routeFeature.setStyle(index === 0 ? primaryRouteStyle : alternativeRouteStyle);
                            geolocationRouteSource.addFeature(routeFeature); // CORRETTO
                        });

                        logDirections(data.routes[0], 'Indicazioni dalla tua posizione');
                        map.getView().fit(geolocationRouteSource.getExtent(), { padding: [50, 50, 50, 50], duration: 1000 });
                    } catch (error) {
                        alert('Impossibile calcolare il percorso.');
                        geolocationRouteSource.clear();
                    } finally {
                        button.disabled = false;
                        button.textContent = 'Get Directions';
                    }
                }, () => {
                    alert('Impossibile ottenere la tua posizione.');
                    button.disabled = false;
                    button.textContent = 'Get Directions';
                });
            }

            // drawSavedRoutes();

           // =======================================================
            // FLUSSO DI ESECUZIONE PRINCIPALE
            // =======================================================
            

            // 1. PREPARA TUTTI I DATI PRIMA DI CREARE LA MAPPA
            const overlays = setUpData();
            drawSavedRoutes();

            // 2. CREA LA MAPPA
            const pos = fromLonLat([parseFloat(maplon), parseFloat(maplat)]);
            const attribution = mapblock.querySelector(".venomaps-get-attribution")?.innerHTML || '';
            let sourcesettings = { url: styleUrl, attributions: attribution };
            if (styleUrl === 'default') sourcesettings = {};

            map = new Map({
                target: 'venomaps_' + mapid,
                view: new View({ center: pos, zoom: zoom, maxZoom: 18, minZoom: 2 }),
                layers: [
                    new Tile({ source: new OSM(sourcesettings) }),
                    savedRoutesLayer,
                    geolocationRouteLayer,
                    clusterLayer
                ],
                controls: controlDefaults({ attributionOptions: { collapsible: true } }).extend([new FullScreen()]),
                interactions: interactionDefaults({ mouseWheelZoom: Boolean(infomap.zoom_scroll) })
            });

            // 3. AGGIUNGI OVERLAY E AGGANCIA EVENTI ALLA MAPPA APPENA CREATA
            overlays.forEach(overlay => map.addOverlay(overlay));
            
            const searchInput = mapblock.querySelector(".venomaps-search");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => updateSearch(e.target.value));
            }
            const directionsButton = document.getElementById('get-directions-' + mapid);
            if (directionsButton && destination) {
                directionsButton.addEventListener('click', getDirections);
            }

            map.on('click', (event) => {
                let hasInteracted = false;

                // Rimuovi l'infobox del percorso precedente, se ne esiste uno
                if (routeInfoOverlay) {
                    map.removeOverlay(routeInfoOverlay);
                    routeInfoOverlay = null;
                }

                // Cerca prima se è stato cliccato un percorso
                const clickedFeature = map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
                    if (layer === savedRoutesLayer) { // Controlla solo il layer dei percorsi salvati
                        return feature;
                    }
                });

                if (clickedFeature) {
                    hasInteracted = true;

                    const routeTitle = clickedFeature.get('route_title');

                    if (routeTitle) {

                        // Crea l'elemento HTML per l'infobox
                        const infoBoxElement = document.createElement('div');
                        infoBoxElement.className = 'wpol-infopanel'; // Riutilizza stili esistenti se possibile

                        const infoLabelElement = document.createElement('div');
                        infoLabelElement.className = 'wpol-infolabel';

                        const arrowElement = document.createElement('div');
                        arrowElement.className = 'wpol-arrow';

                        infoBoxElement.appendChild(infoLabelElement);
                        infoBoxElement.appendChild(arrowElement);

                        infoLabelElement.innerHTML = `<strong>${routeTitle}</strong>`;

                        routeInfoOverlay = new Overlay({
                            position: event.coordinate, 
                            // position: centerCoordinate,
                            positioning: 'bottom-center',
                            element: infoBoxElement,
                            offset: [0, -15], // Sposta l'infobox leggermente sopra la linea
                            stopEvent: false
                        });
                        map.addOverlay(routeInfoOverlay);
                    }
                }

                // Se non è stato cliccato un percorso, gestisci i cluster
                if (!hasInteracted) {
                    clusterLayer.getFeatures(event.pixel).then((clickedFeatures) => {
                        if (clickedFeatures.length > 0) {
                            const clusterMembers = clickedFeatures[0].get('features');
                            const view = map.getView();
                            if (clusterMembers.length > 1) {
                                const extent = createEmpty();
                                clusterMembers.forEach((f) => extend(extent, f.getGeometry().getExtent()));
                                view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
                            } else if (clusterMembers.length === 1) {
                                const paneltarget = clusterMembers[0].get('panel');
                                if (paneltarget) {
                                    paneltarget.classList.remove('infobox-closed');
                                    view.animate({ center: clusterMembers[0].getGeometry().getCoordinates(), duration: 500 });
                                }
                            }
                        }
                    });
                }
            });
            
            map.on('pointermove', function (e) {
                // Cambia il cursore solo se si passa sopra un cluster/marker
                const hit = map.hasFeatureAtPixel(e.pixel, { layerFilter: l => l === clusterLayer });
                map.getTargetElement().style.cursor = hit ? 'pointer' : '';
            });

            // 4. ESEGUI LO ZOOM FINALE
            setTimeout(() => {
                const combinedExtent = createEmpty();
                let hasContent = false;
                if (markersSource.getFeatures().length > 0) {
                    extend(combinedExtent, markersSource.getExtent());
                    hasContent = true;
                }
                if (savedRoutesSource.getFeatures().length > 0) {
                    extend(combinedExtent, savedRoutesSource.getExtent());
                    hasContent = true;
                }
                if (hasContent && combinedExtent[0] < Infinity) {
                    map.getView().fit(combinedExtent, { padding: [50, 50, 50, 50], duration: 1000, maxZoom: 16 });
                }
            }, 100);
        }

        function init(){
            document.querySelectorAll('.wrap-venomaps:not([data-venomap-init])').forEach(thismap => {
                thismap.setAttribute("data-venomap-init", "1");
                initVenoMaps(thismap);
            });
        }
        return { init };
    }());

    function VenoMaps(){ return VenoMapsPlugin.init(); }
    return VenoMaps;
})));

VenoMaps();
