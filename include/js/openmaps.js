jQuery(document).ready(function($) {
    'use strict';

    function initOpenMaps( infomap ){

        if (typeof ol === 'undefined' || ol === null) {
          console.log('WARNING: OpenLayers Library not loaded');
          return false;
        }

        var mapid, maplat, maplon, styleJson, zoom, zoom_scroll;

        mapid = infomap.mapid;
        maplat = infomap.lat;
        maplon = infomap.lon;
        styleJson = infomap.style;
        zoom = infomap.zoom;
        zoom_scroll = infomap.zoom_scroll;

        if ( infomap.zoom_scroll == 1) {
          zoom_scroll = true;
        } else {
          zoom_scroll = false;
        }

        var pos = ol.proj.fromLonLat([parseFloat(maplon), parseFloat(maplat)]);

        if ( styleJson == 0 ) {

          // Default Map
          var map = new ol.Map({
            target: 'openmaps_' + mapid,
            view: new ol.View({
              center: pos,
              zoom: zoom,
              maxZoom: 24,
              minZoom: 1
            }),
            layers: [
              new ol.layer.Tile({
                source: new ol.source.OSM()
              })
            ],
           interactions: ol.interaction.defaults({mouseWheelZoom:zoom_scroll})
          });
        } else {

          // Custom Map
          var map = new ol.Map({
            target: 'openmaps_' + mapid,
            view: new ol.View({
              constrainResolution: true,
              center: pos,
              zoom: zoom,
              maxZoom: 24,
              minZoom: 1
            }),
           interactions: ol.interaction.defaults({mouseWheelZoom:zoom_scroll})
          });
          olms.apply(map, styleJson);
        }

        $('#wrap-overlay-' + mapid + ' .wpol-infomarker').each(function(key){

            var datamarker = $(this).data('marker');
            var markerpos = ol.proj.fromLonLat([parseFloat(datamarker.lon), parseFloat(datamarker.lat)]);
            var markerint = parseFloat(datamarker.size);
            var markeroffset = (markerint * -1)/2;
            var labeloffset = (markerint + 12) * -1;
            
            // Add Marker
            var infomarker = new ol.Overlay({
              position: markerpos,
              positioning: 'center-center',
              offset: [0, markeroffset],
              element: document.getElementById('infomarker_' + mapid + '_' + key),
            });

            map.addOverlay(infomarker);

            // Add infoPanel
            var infolabel = new ol.Overlay({
              position: markerpos,
              positioning: 'bottom-center',
              offset: [0, labeloffset],
              element: document.getElementById('infopanel_' + mapid + '_' + key),
            });

            map.on("movestart", function() {
                map.removeOverlay(infolabel);
            });

            map.on("moveend", function() {
                map.addOverlay(infolabel);
                $('.wpol-infopanel').closest('.ol-overlay-container').addClass('wpol-infopanel-overlay');
            });

        });
    }

    // Init Maps
    $('.wrap-openmaps').each(function( index ) {
        var datamap = $( this ).data('infomap');
        initOpenMaps( datamap );
    });

    // Toggle infoPanel
    $(document).on('click', '.wpol-infopanel', function(){
      $('.ol-overlay-container').removeClass('wpol-infopanel-active');
      $(this).closest('.ol-overlay-container').addClass('wpol-infopanel-active');
    });


    $(document).on('click', '.wpol-infopanel-close', function(){
      $(this).parent('.wpol-infopanel').fadeOut();
    });

    $(document).on('click', '.wpol-infomarker', function(){
      var paneltarget = $(this).data('paneltarget');
      $('#infopanel_' + paneltarget).fadeIn();
    });

});
