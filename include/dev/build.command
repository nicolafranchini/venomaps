cd `dirname $0`

cleancss ol/ol.css venomaps/venomaps.css -o ../css/venomaps-bundle.min.css

uglifyjs ol/ol.js venomaps/venomaps.js --comments --compress --mangle -o ../js/venomaps-bundle.min.js