cd `dirname $0`

cleancss node_modules/ol/ol.css venomaps.css -o ../css/venomaps-bundle.css
cleancss node_modules/ol/ol.css venomaps-admin.css -o ../css/venomaps-admin-bundle.css

npm run build
