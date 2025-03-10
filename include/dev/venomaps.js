import {Map, View, Overlay, Feature} from 'ol';

import {fromLonLat} from 'ol/proj';
import {Point} from 'ol/geom';
import {Style, Icon, Circle, Fill, Stroke, Text} from 'ol/style';
import {Vector as sourceVector, Cluster, OSM} from 'ol/source';
import {asArray} from 'ol/color';
import {Vector as LayerVector, Tile} from 'ol/layer';
import {defaults as controlDefaults} from 'ol/control/defaults';
import {FullScreen} from 'ol/control';
import {defaults as interactionDefaults} from 'ol/interaction/defaults';
import {getVectorContext} from 'ol/render';
import {fromExtent} from 'ol/geom/Polygon';
import {createEmpty, extend, getWidth, getHeight} from 'ol/extent';

 (function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VenoMaps = factory());
}(self, (function () { 'use strict';

    var VenoMapsPlugin = (function(){

        function initVenoMaps(getinfomap){

            var infomap = JSON.parse(getinfomap);

            // if (typeof ol === 'undefined' || ol === null) {
            //   console.log('WARNING: OpenLayers Library not loaded');
            //   return false;
            // }
            var map, mapid, maplat, maplon, zoom, zoom_scroll, styleUrl, attribution, getsource, cluster_color, cluster_bg;

            mapid = infomap.mapid;
            maplat = infomap.lat;
            maplon = infomap.lon;
            styleUrl = infomap.style_url;
            attribution = infomap.attribution;
            zoom = infomap.zoom;
            zoom_scroll = infomap.zoom_scroll;
            cluster_color = infomap.cluster_color;
            cluster_bg = infomap.cluster_bg;

            zoom_scroll = Boolean(infomap.zoom_scroll);

            var pos = fromLonLat([parseFloat(maplon), parseFloat(maplat)]);

            const setupdata = new Array();
            let features = new Array();

            const allclosepanel = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infopanel-close');
            const allpanels = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infopanel');


            function setUpMarkers() {

console.log('setUpMarkers')
                const allinfomarkers = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infomarker');

                // Setup markers
                allinfomarkers.forEach(function(infomarkerdom, key) {

                    const datamarker = JSON.parse(infomarkerdom.dataset.marker);
                    const markerpos = fromLonLat([parseFloat(datamarker.lon), parseFloat(datamarker.lat)]);
                    const markerint = parseFloat(datamarker.size);
                    const markeroffset = (markerint * -1) / 2;
                    const labeloffset = (markerint + 12) * -1;
                    const markerimage = infomarkerdom.querySelector('img');

                    if (infomarkerdom) {

                        var labelDom = document.getElementById('infopanel_' + mapid + '_' + key);
                        var infolabel = false;
var labeltext = false;
                        if (labelDom) {


var infolabelDom = labelDom.querySelector('.wpol-infolabel');
labeltext = infolabelDom ? infolabelDom.innerText : false;

                            // Add infoPanel
                            infolabel = new Overlay({
                              position: markerpos,
                              positioning: 'bottom-center',
                              offset: [0, labeloffset],
                              element: labelDom,
                              // stopEvent: true,
                            });


                        }

                        setupdata[key] = {};
                        setupdata[key].label = infolabel;

setupdata[key].text = labeltext;

                        let feature = new Feature(new Point(markerpos));
setupdata[key].key = key;

                        var style = new Style({
                            image: new Icon({
                                src: markerimage.src,
                                height: markerint,
                                displacement: [0, -markeroffset],
                                crossOrigin: "anonymous"
                            })
                        });

                        features[key] = feature;

                        feature.set('stile', style);
                        feature.set('panel', labelDom);
feature.set('visible', true);
                        allclosepanel.forEach(thisclosepanel => {
                            thisclosepanel.addEventListener('click', function(){
                                var infobox = thisclosepanel.parentNode;
                                if (!infobox.classList.contains('infobox-closed')) {
                                    infobox.classList.add('infobox-closed');
                                    infobox.classList.remove('was-open');
                                }
                            });
                        });
                    }
                }); // END SETUP MARKERS

            }



            function setUp() {
                setUpMarkers();
                loadMap();
            }

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

            function setupClusters(){
    console.log("setupClusters")
                // Setup clusters
                const source = new sourceVector({
                    features: features,
                });

                const mindistance = 20;
                const distanceinput = 40;

                const clusterSource = new Cluster({
                    distance: parseInt(distanceinput, 10),
                    minDistance: parseInt(mindistance, 10),
                    source: source,

geometryFunction: (feature) => {
closepanels(feature.get('panel'));
if (feature.get('visible')) {

    return feature.getGeometry();
}
      },

                });
                
                // Get rgba color
                var cluster_bg_array = asArray(cluster_bg).slice();
                cluster_bg_array[3] = 0.3;

                const clusters = new LayerVector({
                    source: clusterSource,
                    style: function(feature) {
                        const size = feature.get('features').length;

                        const clusterstyle = [
                            new Style({
                                image: new Circle({
                                    radius: 22,
                                    fill: new Fill({
                                        color: cluster_bg_array,
                                    }),
                                })
                            }),
                            new Style({
                                image: new Circle({
                                    radius: 15,
                                    stroke: new Stroke({
                                        color: cluster_color,
                                    }),
                                    fill: new Fill({
                                        color: cluster_bg,
                                    }),
                                }),
                                text: new Text({
                                    text: size.toString(),
                                    fill: new Fill({
                                        color: cluster_color,
                                    }),
                                }),
                                zIndex: 9999
                            })
                        ];

                        var style = false;
                        if (size > 1) {
                            style = clusterstyle;
                            feature.get('features').forEach(feature => {
                                closepanels(feature.get('panel'));
                                // style = clusterstyle;
                            });
                        } else {

                            const originalFeature = feature.get('features')[0];

                            openpanels(originalFeature.get('panel'));

                            style = originalFeature.get('stile');

                        }

                        return style;
                    }
                });
                return clusters;
            }
            // END SETUP Clusters

            function loadMap() {
    console.log("loadMap")

                const clusters = setupClusters();
                let sourcesettings = {};
                if ( styleUrl !== 'default' ) {
                    sourcesettings.url = styleUrl;
                    if ( attribution ) {
                        sourcesettings.attributions = attribution;
                    }
                }

                getsource = new OSM(sourcesettings);

                var baselayer = new Tile({
                    source: getsource
                });

                map = new Map({
                    target: 'venomaps_' + mapid,
                    view: new View({
                        center: pos,
                        zoom: zoom,
                        maxZoom: 22,
                        minZoom: 1,
                    }),
                    layers: [
                        baselayer,
                        clusters
                    ],
                    controls: controlDefaults({ attributionOptions: { collapsible: true } }).extend([new FullScreen()]),
                    interactions: interactionDefaults({mouseWheelZoom:zoom_scroll})
                });

                baselayer.on("postrender", function (event) {
                  var vectorContext = getVectorContext(event);
                  vectorContext.setStyle(
                    new Style({
                      fill: new Fill({
                        color: "rgba(100, 100, 100, 0.2)"
                      })
                    })
                  );
                  var polygon = fromExtent(map.getView().getProjection().getExtent());
                  vectorContext.drawGeometry(polygon);
                });

                setupdata.forEach(marker => {
                    if (marker.label) {
                        map.addOverlay(marker.label);
                    }
                });


//         console.log("getsource")

// console.log(getsource)

//         console.log("baselayer")

// console.log(baselayer)



var searchmap = document.getElementById("search-venomap-"+mapid);
searchmap.value = "";
searchmap.addEventListener("input", function(){

 if (setupdata) { 
    setupdata.forEach(marker => {

    if (searchmap.value.length > 1 ) {
        if (marker.text) {
            // Found marker
            if (marker.text.toLowerCase().includes(searchmap.value.toLowerCase())) {
                console.log("FOUND")
                features[marker.key].set('visible', true);
            } else {
                features[marker.key].set('visible', false);
            }
        } else {
            // Hide markers without text
            features[marker.key].set('visible', false);
        }
    } else {
        // Reset search
        features[marker.key].set('visible', true);
    }

        // if (marker.text && searchmap.value.length > 1 ) {

        //     features[marker.key].set('visible', false);

        //     if (marker.text.search(searchmap.value) !== -1) {
        //         console.log("FOUND")
        //         features[marker.key].set('visible', true);
        //     } else {
        //         features[marker.key].set('visible', false);
        //     }
        // } else {
        //     features[marker.key].set('visible', false);
        // }
    });
}



})


                map.on('click', (event) => {
                    clusters.getFeatures(event.pixel).then((features) => {
                        if (features.length > 0) {
                            const clusterMembers = features[0].get('features');
                                const view = map.getView();
                                if (clusterMembers.length > 1) {
                                    // Calculate the extent of the cluster members.
                                    const extent = createEmpty();
                                    clusterMembers.forEach((feature) => extend(extent, feature.getGeometry().getExtent()));
                                    
                                    const resolution = map.getView().getResolution();

                                    if ( view.getZoom() !== view.getMaxZoom() && (getWidth(extent) > resolution || getHeight(extent) > resolution)) {
                                        view.fit(extent, {duration: 500, padding: [60, 60, 60, 60]});
                                    }
                                }
                                if (clusterMembers.length === 1) { {
                                    var allinfopanels = document.querySelectorAll('.wpol-infopanel');
                                    var alloverlays = document.querySelectorAll('.ol-overlay-container');
                                    var paneltarget = clusterMembers[0].get('panel');
                                    if (paneltarget) {
                                        alloverlays.forEach(thisoverlay => {
                                            thisoverlay.classList.remove('wpol-infopanel-active');
                                        });
                                        paneltarget.parentNode.classList.add('wpol-infopanel-active');
                                        paneltarget.classList.remove('infobox-closed', 'was-open');
                                        // Center map to marker
                                        const point = clusterMembers[0].getGeometry();
                                        view.animate({center: point.getCoordinates()});
                                    }
                                }
                            }
                        }
                    });
                });

                // change mouse cursor when over marker
                map.on('pointermove', function (e) {
                    const pixel = map.getEventPixel(e.originalEvent);
                    const pixelFeatures = map.getFeaturesAtPixel(pixel);
                    const features = pixelFeatures.length > 0 ? pixelFeatures[0].get('features') : false;
                    const hit = map.hasFeatureAtPixel(pixel) && (features.length > 1 || (features.length === 1 && features[0].get('panel')));
                    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
                });
            }

            setUp(); 
        }

        function init(){

            // Init Maps
            var allmaps = document.querySelectorAll('.wrap-venomaps');
            allmaps.forEach(thismap => {
                if (!thismap.hasAttribute("data-venomap-init")) {
                    thismap.setAttribute("data-venomap-init", "1");
                    var datamap = thismap.dataset.infomap;
                    initVenoMaps(datamap);
                }

            });
        }

        return {
            init
        };
    }());

    function VenoMaps(){
        return VenoMapsPlugin.init();
    }
    return VenoMaps;
})));

// console.log(VenoMaps);

VenoMaps();