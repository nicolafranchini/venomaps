import './venomaps.css'; // Rollup userà questo per generare il file CSS
import { Map, View, Overlay, Feature } from 'ol';
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

const VenoMaps = {
    /**
     * Inizializza una singola istanza della mappa
     */
    initVenoMaps(mapblock) {
        const infomap = JSON.parse(mapblock.dataset.infomap);
        const { mapid, lat: maplat, lon: maplon, zoom, cluster_color, cluster_bg, destination, routes, zoom_markers } = infomap;
        const styleUrl = decodeURIComponent(infomap.style_url);
        const routeColors = ['#009CD7', '#FF6347', '#32CD32', '#FFD700', '#DA70D6', '#1E90FF'];

        let map; 
        let routeInfoOverlay = null;

        // --- SOURCE ---
        const markersSource = new VectorSource();
        const savedRoutesSource = new VectorSource();
        const geolocationRouteSource = new VectorSource(); 
        const clusterSource = new Cluster({ distance: 50, minDistance: 20, source: markersSource });
        
        // --- LAYER ---
        const savedRoutesLayer = new VectorLayer({ source: savedRoutesSource, zIndex: 5 });
        const geolocationRouteLayer = new VectorLayer({ source: geolocationRouteSource, zIndex: 6 });
        const clusterLayer = new VectorLayer({
            source: clusterSource,
            zIndex: 10,
            style: (feature) => {
                const clusterMembers = feature.get('features').filter(f => f.get('is_matching_search') !== false);
                const size = clusterMembers.length;
                if (size === 0) return null;

                if (size > 1) {
                    const cluster_bg_array = asArray(cluster_bg).slice();
                    cluster_bg_array[3] = 0.3; // Trasparenza per l'anello esterno
                    const radius = Math.min(parseInt(Math.sqrt(size) + 16), 25);
                    return [
                        new Style({ 
                            image: new Circle({ 
                                radius: (7 + radius), 
                                fill: new Fill({ color: cluster_bg_array }) 
                            }) 
                        }),
                        new Style({
                            image: new Circle({ 
                                radius: radius, 
                                stroke: new Stroke({ color: cluster_color, width: 2 }), 
                                fill: new Fill({ color: cluster_bg }) 
                            }),
                            text: new Text({ 
                                text: size.toString(), 
                                fill: new Fill({ color: cluster_color }), 
                                font: "bold 12px sans-serif" 
                            })
                        })
                    ];
                } else {
                    return clusterMembers[0].get('stile');
                }
            }
        });

        // --- STILI PERCORSI ---
        const primaryRouteStyle = new Style({ stroke: new Stroke({ color: '#009CD7', width: 7, lineCap: 'round' }) });
        const alternativeRouteStyle = new Style({ stroke: new Stroke({ color: '#86B9D4', width: 5, lineCap: 'round' }) });

        // --- FUNZIONI HELPER INTERNE ---
        const closepanels = (thispanel = false) => {
            if (thispanel && !thispanel.classList.contains('infobox-closed')) {
                thispanel.classList.add('was-open', 'infobox-closed');
            }
        };

        const openpanels = (thispanel = false) => {
            if (thispanel && thispanel.classList.contains('was-open')) {
                thispanel.classList.remove('infobox-closed');
            }
        };

        const buildInstruction = (maneuver) => {
            let instruction = '';
            const type = maneuver.type;
            const modifier = maneuver.modifier;

            switch (type) {
                case 'depart': instruction = 'Parti'; break;
                case 'arrive': instruction = 'Sei arrivato a destinazione'; break;
                case 'merge': instruction = 'Immettiti'; break;
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
                case 'new name': instruction = 'Continua dritto'; break;
                case 'continue': instruction = `Continua su ${modifier}`; break;
                case 'roundabout': instruction = `Alla rotonda, prendi la ${maneuver.exit}ª uscita`; break;
                case 'rotary': instruction = `Entra nella rotatoria e prendi la ${maneuver.exit}ª uscita`; break;
                default: instruction = `${type} ${modifier || ''}`; break;
            }
            return instruction.charAt(0).toUpperCase() + instruction.slice(1);
        };

        const logDirections = (route, title = 'Indicazioni') => {
            if (!route || !route.legs) return;
            console.clear();
            const duration = Math.round(route.duration / 60);
            const distance = (route.distance / 1000).toFixed(2);
            console.log(`%c--- ${title} (Durata: ${duration} min, Distanza: ${distance} km) ---`, 'color: #009CD7; font-weight: bold; font-size: 14px;');
            route.legs[0].steps.forEach((step, index) => {
                const stepDistance = (step.distance / 1000).toFixed(2);
                const streetName = step.name ? `su ${step.name}` : '';
                const instructionText = buildInstruction(step.maneuver);
                console.log(`${index + 1}. ${instructionText} ${streetName} (per ${stepDistance} km)`);
            });
        };

        const setUpData = () => {
            const wrapoverlay = mapblock.querySelector('#wrap-overlay-' + mapid);
            if (!wrapoverlay) return [];
            const allinfomarkers = wrapoverlay.querySelectorAll(".wpol-infomarker");
            const features = [];
            const overlays = [];

            allinfomarkers.forEach((infomarkerdom, key) => {
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
                        closeButton.addEventListener('click', (e) => {
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
            return overlays;
        };

        const drawSavedRoutes = () => {
            if (!routes || routes.length === 0) return;
            const format = new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
            routes.forEach((routeData, index) => {
                if (!routeData.geometry) return;
                try {
                    const feature = format.readFeature(routeData.geometry);
                    if (feature && feature.getGeometry()) {
                        feature.set('route_data', routeData);
                        feature.set('route_title', routeData.title);
                        feature.setStyle(new Style({
                            stroke: new Stroke({
                                color: routeColors[index % routeColors.length],
                                width: 6, lineCap: 'round', lineJoin: 'round'
                            })
                        }));
                        savedRoutesSource.addFeature(feature);
                    }
                } catch(e) { console.error("Errore parsing GeoJSON", e); }
            });
        };

        const updateSearch = (term) => {
            const searchTerm = term.toLowerCase();
            let featuresToShow = [];

            markersSource.forEachFeature((feature) => {
                const panel = feature.get('panel');
                let isVisible = true;
                if (searchTerm.length > 2) {
                    const infoboxText = panel?.querySelector('.wpol-infolabel')?.innerText.toLowerCase() || '';
                    isVisible = infoboxText.includes(searchTerm);
                    if (isVisible) featuresToShow.push(feature);
                }
                feature.set('is_matching_search', isVisible);
            });

            clusterLayer.getSource().refresh();

            if (searchTerm.length > 2 && featuresToShow.length > 0) {
                const tempSource = new VectorSource({ features: featuresToShow });
                map.getView().fit(tempSource.getExtent(), { duration: 500, padding: [100, 100, 100, 100], maxZoom: 15 });
            }
        };

        const getDirections = async () => {
            if (!('geolocation' in navigator)) return;
            const button = document.getElementById('get-directions-' + mapid);
            button.disabled = true;
            button.textContent = 'Trovo la posizione...';

            navigator.geolocation.getCurrentPosition(async (position) => {
                geolocationRouteSource.clear();
                const userLon = position.coords.longitude;
                const userLat = position.coords.latitude;
                const userMarker = new Feature({ geometry: new Point(fromLonLat([userLon, userLat])) });
                userMarker.setStyle(new Style({ image: new Circle({ radius: 8, fill: new Fill({ color: '#2a6fdb' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }) }));
                geolocationRouteSource.addFeature(userMarker);
                
                button.textContent = 'Calcolo il percorso...';
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

                try {
                    const response = await fetch(osrmUrl);
                    const data = await response.json();
                    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) throw new Error('No routes');

                    data.routes.forEach((route, index) => {
                        const routeGeometry = new LineString(route.geometry.coordinates).transform('EPSG:4326', 'EPSG:3857');
                        const routeFeature = new Feature({ geometry: routeGeometry });
                        routeFeature.set('route_data', route);
                        routeFeature.set('is_geolocation_route', true);
                        routeFeature.setStyle(index === 0 ? primaryRouteStyle : alternativeRouteStyle);
                        geolocationRouteSource.addFeature(routeFeature);
                    });

                    logDirections(data.routes[0], 'Indicazioni dalla tua posizione');
                    map.getView().fit(geolocationRouteSource.getExtent(), { padding: [50, 50, 50, 50], duration: 1000 });
                } catch (error) {
                    alert('Impossibile calcolare il percorso.');
                } finally {
                    button.disabled = false;
                    button.textContent = 'Get Directions';
                }
            }, () => {
                alert('Posizione non disponibile.');
                button.disabled = false;
                button.textContent = 'Get Directions';
            });
        };

        // --- ESECUZIONE ---
        const overlays = setUpData();
        drawSavedRoutes();

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
            if (routeInfoOverlay) {
                map.removeOverlay(routeInfoOverlay);
                routeInfoOverlay = null;
            }

            let hasInteracted = false;

            clusterLayer.getFeatures(event.pixel).then((clickedFeatures) => {
                if (clickedFeatures.length > 0) {
                    const clusterMembers = clickedFeatures[0].get('features');
                    const view = map.getView();

                    if (clusterMembers.length > 1) {
                        const extent = createEmpty();
                        clusterMembers.forEach((f) => extend(extent, f.getGeometry().getExtent()));
                        view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
                        hasInteracted = true;
                    } else if (clusterMembers.length === 1) {
                        const paneltarget = clusterMembers[0].get('panel');
                        if (paneltarget) {
                            paneltarget.classList.remove('infobox-closed');
                            view.animate({ center: clusterMembers[0].getGeometry().getCoordinates(), duration: 500 });
                            hasInteracted = true;
                        }
                    }
                }

                if (!hasInteracted) {
                    const clickedFeature = map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
                        if (layer === savedRoutesLayer) return feature;
                    });

                    if (clickedFeature && clickedFeature.get('route_title')) {
                        const routeTitle = clickedFeature.get('route_title');
                        const infoBoxElement = document.createElement('div');
                        infoBoxElement.className = 'wpol-infopanel';
                        infoBoxElement.innerHTML = `<div class="wpol-infolabel"><strong>${routeTitle}</strong></div><div class="wpol-arrow"></div>`;

                        routeInfoOverlay = new Overlay({
                            position: event.coordinate,
                            positioning: 'bottom-center',
                            element: infoBoxElement,
                            offset: [0, -15],
                            stopEvent: false
                        });
                        map.addOverlay(routeInfoOverlay);
                    }
                }
            });
        });
        
        map.on('pointermove', (e) => {
            const hit = map.hasFeatureAtPixel(e.pixel, { layerFilter: l => l === clusterLayer });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        if (zoom_markers) {
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
    },

    /**
     * Cerca tutti i contenitori mappa nel DOM e li inizializza
     */
    init() {
        const maps = document.querySelectorAll('.wrap-venomaps:not([data-venomap-init])');
        maps.forEach(thismap => {
            thismap.setAttribute("data-venomap-init", "1");
            this.initVenoMaps(thismap);
        });
    }
};

// Auto-init al caricamento del DOM
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => VenoMaps.init());
    } else {
        VenoMaps.init();
    }
}

export default VenoMaps;
