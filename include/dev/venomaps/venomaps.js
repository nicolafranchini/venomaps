(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VenoMaps = factory());
}(this, (function () { 'use strict';

    var VenoMapsPlugin = (function(){

        function initVenoMaps(getinfomap){

            var infomap = JSON.parse(getinfomap);

            if (typeof ol === 'undefined' || ol === null) {
              console.log('WARNING: OpenLayers Library not loaded');
              return false;
            }
            var map, mapid, maplat, maplon, zoom, zoom_scroll, styleUrl, customStyle, attribution, getsource, cluster_color, cluster_bg;

            mapid = infomap.mapid;
            maplat = infomap.lat;
            maplon = infomap.lon;
            styleUrl = infomap.style_url;
            customStyle = infomap.custom_style;
            attribution = infomap.attribution;
            zoom = infomap.zoom;
            zoom_scroll = infomap.zoom_scroll;
            cluster_color = infomap.cluster_color;
            cluster_bg = infomap.cluster_bg;

            zoom_scroll = Boolean(infomap.zoom_scroll);

            var pos = ol.proj.fromLonLat([parseFloat(maplon), parseFloat(maplat)]);

            const setupdata = new Array();
            const features = new Array();

            const allinfomarkers = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infomarker');
            const allclosepanel = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infopanel-close');
            const allpanels = document.querySelectorAll('#wrap-overlay-' + mapid + ' .wpol-infopanel');


            function setUp() {
                // Setup markers
                allinfomarkers.forEach(function(infomarkerdom, key) {

                    const datamarker = JSON.parse(infomarkerdom.dataset.marker);
                    const markerpos = ol.proj.fromLonLat([parseFloat(datamarker.lon), parseFloat(datamarker.lat)]);
                    const markerint = parseFloat(datamarker.size);
                    const markeroffset = (markerint * -1) / 2;
                    const labeloffset = (markerint + 12) * -1;
                    const markerimage = infomarkerdom.querySelector('img');

                    if (infomarkerdom) {

                        var labelDom = document.getElementById('infopanel_' + mapid + '_' + key);
                        var infolabel = false;

                        if (labelDom) {
                            // Add infoPanel
                            infolabel = new ol.Overlay({
                              position: markerpos,
                              positioning: 'bottom-center',
                              offset: [0, labeloffset],
                              element: labelDom,
                              // stopEvent: true,
                            });
                        }

                        setupdata[key] = {};
                        setupdata[key].label = infolabel;

                        let feature = new ol.Feature(new ol.geom.Point(markerpos));

                        var style = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: markerimage.src,
                                height: markerint,
                                displacement: [0, -markeroffset],
                                crossOrigin: "anonymous"
                            })
                        });

                        feature.setStyle(style);

                        features[key] = feature;

                        feature.set('stile', style);
                        feature.set('panel', labelDom);

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
                // Setup clusters
                const source = new ol.source.Vector({
                    features: features,
                });

                const mindistance = 20;
                const distanceinput = 40;

                const clusterSource = new ol.source.Cluster({
                    distance: parseInt(distanceinput, 10),
                    minDistance: parseInt(mindistance, 10),
                    source: source,
                });
                
                // Get rgba color
                var cluster_bg_array = ol.color.asArray(cluster_bg).slice();
                cluster_bg_array[3] = 0.3;

                const clusters = new ol.layer.Vector({
                    source: clusterSource,
                    style: function(feature) {
                        const size = feature.get('features').length;
                        const clusterstyle = [
                            new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 22,
                                    fill: new ol.style.Fill({
                                        color: cluster_bg_array,
                                    }),

                                }),
                            }),
                            new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 15,
                                    stroke: new ol.style.Stroke({
                                        color: cluster_color,
                                    }),
                                    fill: new ol.style.Fill({
                                        color: cluster_bg,
                                    }),
                                }),
                                text: new ol.style.Text({
                                    text: size.toString(),
                                    fill: new ol.style.Fill({
                                        color: cluster_color,
                                    }),
                                }),
                                zIndex: 9999
                            }),

                        ];

                        var style = false;
                        if (size > 1) {
                            var style = clusterstyle;
                            feature.get('features').forEach(feature => {
                                closepanels(feature.get('panel'));
                                style = clusterstyle;
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

                const clusters = setupClusters();
                let sourcesettings = {};
                if ( styleUrl !== 'default' ) {
                    sourcesettings.url = styleUrl;
                    if ( attribution ) {
                        sourcesettings.attributions = attribution;
                    }
                }

                getsource = new ol.source.OSM(sourcesettings);

                map = new ol.Map({
                    target: 'venomaps_' + mapid,
                    view: new ol.View({
                        center: pos,
                        zoom: zoom,
                        maxZoom: 22,
                        minZoom: 1,
                    }),
                    layers: [
                        new ol.layer.Tile({
                            source: getsource
                        }),
                       clusters
                    ],
                    controls: ol.control.defaults.defaults({ attributionOptions: { collapsible: true } }),
                    interactions: ol.interaction.defaults.defaults({mouseWheelZoom:zoom_scroll})
                });

                setupdata.forEach(marker => {
                    if (marker.label) {
                        map.addOverlay(marker.label);
                    }
                });

                map.on('click', (event) => {
                    clusters.getFeatures(event.pixel).then((features) => {
                        if (features.length > 0) {
                            const clusterMembers = features[0].get('features');
            
                                if (clusterMembers.length > 1) {
                                    // Calculate the extent of the cluster members.
                                    const extent = ol.extent.createEmpty();
                                    clusterMembers.forEach((feature) => ol.extent.extend(extent, feature.getGeometry().getExtent()));
                                    const view = map.getView();
                                    const resolution = map.getView().getResolution();

                                    if ( view.getZoom() !== view.getMaxZoom() && (ol.extent.getWidth(extent) > resolution || ol.extent.getHeight(extent) > resolution)) {
                                        view.fit(extent, {duration: 500, padding: [60, 60, 60, 60]});
                                    }
                                }
                                if (clusterMembers.length === 1) { {

                                    var allinfopanels = document.querySelectorAll('.wpol-infopanel');
                                    var alloverlays = document.querySelectorAll('.ol-overlay-container');
                                    // var paneltarget_id = infomarkerdom.dataset.paneltarget;
                                    var paneltarget = clusterMembers[0].get('panel');

                                    // var paneltarget = document.querySelector('#' + paneltarget_id);

                                    if (paneltarget) {

                                        alloverlays.forEach(thisoverlay => {
                                            thisoverlay.classList.remove('wpol-infopanel-active');
                                        });

                                        paneltarget.parentNode.classList.add('wpol-infopanel-active');
                                        // paneltarget.style.display = 'block';
                                        paneltarget.classList.remove('infobox-closed', 'was-open');

                                    }

                                }

                            }
                        }
                    });
                });

            }
            setUp(); 
        }

        function init(){

            // Init Maps
            var allmaps = document.querySelectorAll('.wrap-venomaps');
            allmaps.forEach(thismap => {
                var datamap = thismap.dataset.infomap;
                initVenoMaps(datamap);
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
