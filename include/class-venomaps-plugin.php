<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
/**
 * Plugin class
 */
class Venomaps_Plugin {

	/**
	 * Plugin name
	 *
	 * @var string
	 */
	private $slug = 'venomaps';

	/**
	 * Plugin's public display name.
	 *
	 * @var string
	 */
	private $plugin_name = 'VenoMaps';

	/**
	 * Refers to a single instance of this class.
	 *
	 * @var $instance
	 */
	private static $instance = null;

	/**
	 * Counts decks on page
	 *
	 * @var number
	 */
	private static $mapscounter = 0;

	/**
	 * Default settings.
	 *
	 * @var $default_settings
	 */
	private $default_settings = array(
		'lat'            => '',
		'lon'            => '',
		'size'           => '40',
		'icon'           => '',
		'color'          => '#000000',
		'infobox_open'   => 0,
		'infobox'        => '',
		'title'          => '',
	);

	/**
	 * Default coordinates.
	 *
	 * @var $default_coords
	 */
	private $default_coords = array(
		'lat' => '40.712776',
		'lon' => '-74.005974',
	);

	/**
	 * Default map styles.
	 *
	 * @var $all_styles
	 */
	private $all_styles = array(
		'default'      => array(
			'attribution' => array(
				'osm' => array(
					'link'  => 'https://www.openstreetmap.org/copyright/',
					'title' => 'OpenStreetMap',
				),
			),
			'maps'        => array(
				'default' => array(
					'name' => 'Default',
					'url'  => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
				),
			),
		),
		'maptiler'     => array(
			'attribution' => array(
				'maptiler' => array(
					'link'  => 'https://www.maptiler.com/copyright/',
					'title' => 'MapTiler',
				),
				'osm'      => array(
					'link'  => 'https://www.openstreetmap.org/about/',
					'title' => 'OpenStreetMap contributors',
				),
			),
			'maps'        => array(
				'backdrop'  => array(
					'name' => 'Backdrop',
					'url'  => 'https://api.maptiler.com/maps/backdrop/{z}/{x}/{y}.png?key=',
				),
				'basic'     => array(
					'name' => 'Basic',
					'url'  => 'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=',
				),
				'ocean'     => array(
					'name' => 'Ocean',
					'url'  => 'https://api.maptiler.com/maps/ocean/{z}/{x}/{y}.png?key=',
				),
				'satellite' => array(
					'name' => 'Satellite',
					'url'  => 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=',
				),
				'streets'   => array(
					'name' => 'Streets',
					'url'  => 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=',
				),
				'toner'     => array(
					'name' => 'Toner',
					'url'  => 'https://api.maptiler.com/maps/toner-v2/{z}/{x}/{y}.png?key=',
				),
				'topo'      => array(
					'name' => 'Topo',
					'url'  => 'https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=',
				),
				'winter'    => array(
					'name' => 'Winter',
					'url'  => 'https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=',
				),
			),
		),
		'stadiamaps'   => array(
			'attribution' => array(
				'stadia' => array(
					'link'  => 'https://www.stadiamaps.com/',
					'title' => 'Stadia Maps',
				),
				'stamen' => array(
					'link'  => 'https://stamen.com/',
					'title' => 'Stamen Design',
				),
				'omt'    => array(
					'link'  => 'https://openmaptiles.org/',
					'title' => 'OpenMapTiles',
				),
				'osm'    => array(
					'link'  => 'https://www.openstreetmap.org/about/',
					'title' => 'OpenStreetMap contributors',
				),
			),
			'maps'        => array(
				'terrain'     => array(
					'name' => 'Terrain',
					'url'  => 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png?api_key=',
				),
				'toner'       => array(
					'name' => 'Toner',
					'url'  => 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}@2x.png?api_key=',
				),
				'watercolor'  => array(
					'name' => 'Watercolor',
					'url'  => 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=',
				),
			),
		),
		'thunderforest' => array(
			'attribution' => array(
				'thunderforest' => array(
					'link'  => 'https://www.thunderforest.com/',
					'title' => 'Thunderforest',
				),
				'osm'           => array(
					'link'  => 'https://www.openstreetmap.org/about/',
					'title' => 'OpenStreetMap contributors',
				),
			),
			'maps'        => array(
				'atlas'          => array(
					'name' => 'Atlas',
					'url'  => 'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=',
				),
				'landscape'      => array(
					'name' => 'Landscape',
					'url'  => 'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=',
				),
				'mobile_atlas'   => array(
					'name' => 'Mobile Atlas',
					'url'  => 'https://tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey=',
				),
				'neighbourhood'  => array(
					'name' => 'Neighbourhood',
					'url'  => 'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=',
				),
				'opencyclemap'   => array(
					'name' => 'Open Cycle',
					'url'  => 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=',
				),
				'outdoors'       => array(
					'name' => 'Outdoors',
					'url'  => 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=',
				),
				'pioneer'        => array(
					'name' => 'Pioneer',
					'url'  => 'https://tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey=',
				),
				'spinal'         => array(
					'name' => 'Spinal',
					'url'  => 'https://tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey=',
				),
				'transport'      => array(
					'name' => 'Transport',
					'url'  => 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=',
				),
				'transport_dark' => array(
					'name' => 'Transport Dark',
					'url'  => 'https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=',
				),
			),
		),
	);


	/**
	 * Creates or returns an instance of this class.
	 *
	 * @return  Venomaps_Plugin a single instance of this class.
	 */
	public static function get_instance() {
		if ( null == self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}
		return self::$instance;
	}

	/**
	 * Initializes the plugin
	 */
	private function __construct() {
		require __DIR__ . '/class-venomaps-options.php';

		// Include and instantiate the edit class.
		require __DIR__ . '/class-venomaps-edit.php';
		$venomaps_edit = new Venomaps_Edit( $this );
		$venomaps_edit->init_hooks();
	}

	/**
	 * Getter for default_settings.
	 *
	 * @return array
	 */
	public function get_default_settings() {
		return $this->default_settings;
	}

	/**
	 * Getter for default_coords.
	 *
	 * @return array
	 */
	public function get_default_coords() {
		return $this->default_coords;
	}

	/**
	 * Initiate hooks
	 */
	public function hooks() {
		add_filter( 'plugin_action_links_' . dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/' . $this->slug . '.php', array( $this, 'action_links' ) );
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_scripts' ) );

		// Custom posts.
		add_action( 'init', array( $this, 'register_cpt' ) );
		register_activation_hook( dirname( __DIR__ ) . '/' . $this->slug . '.php', array( $this, 'activate_plugin' ) );

		add_action( 'init', array( $this, 'register_venomaps_block' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'localize_venomaps_block_data' ) );

		add_action( 'wp_ajax_vmap_set_csv', array( $this, 'set_csv' ) );
		add_filter( 'post_row_actions', array( $this, 'duplicate_post_link' ), 25, 2 );
		add_action( 'admin_action_vmaps_duplicate_post_as_draft', array( $this, 'duplicate_post_as_draft' ) );
		add_action( 'admin_notices', array( $this, 'duplication_admin_notice' ) );
		// Review notice.
		add_action( 'admin_init', array( $this, 'check_installation_date' ) );
		add_action( 'admin_notices', array( $this, 'display_review_notice' ) );
		add_action( 'wp_ajax_' . $this->slug . '_dismiss_review_notice', array( $this, 'dismiss_review_notice' ) );

		// Check routes.
		add_action( 'wp_ajax_vmap_fetch_osrm_routes', array( $this, 'fetch_osrm_routes_ajax' ) );

		add_shortcode( 'venomap', array( $this, 'venomaps_do_shortcode' ) );
	}

	/**
	 * AJAX handler to fetch routes from OSRM.
	 */
	public function fetch_osrm_routes_ajax() {
		check_ajax_referer( 'vmap-ajax-nonce', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Permission denied.' );
		}

		$coords_string = isset( $_POST['coords'] ) ? wp_unslash( $_POST['coords'] ) : '';

		if ( ! preg_match( '/^[0-9.,;\-]+$/', $coords_string ) ) {
			wp_send_json_error( 'Invalid characters in coordinates string.' );
		}

		if ( empty( $coords_string ) ) {
			wp_send_json_error( 'No coordinates provided.' );
		}

		$url = "https://router.project-osrm.org/route/v1/driving/{$coords_string}?overview=full&geometries=geojson&alternatives=true&steps=true";

		$response = wp_remote_get( $url, array( 'timeout' => 15 ) );

		if ( is_wp_error( $response ) ) {
			wp_send_json_error( $response->get_error_message() );
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! $data || 'Ok' !== ( $data['code'] ?? 'Error' ) ) {
			wp_send_json_error( 'OSRM API error: ' . ( $data['message'] ?? 'Unknown error from OSRM' ) );
		}

		wp_send_json_success( $data['routes'] );
	}

	/**
	 * Set duplicate link in post edit
	 * https://github.com/rudrastyh/rudr-duplicate-post/blob/main/rudr-duplicate-post.php
	 *
	 * @param string $actions actions.
	 * @param obj    $post    the post.
	 *
	 * @return parsed file
	 */
	public function duplicate_post_link( $actions, $post ) {

		if ( ! current_user_can( 'edit_posts' ) || 'venomaps' !== $post->post_type ) {
			return $actions;
		}

		$url = wp_nonce_url(
			add_query_arg(
				array(
					'action' => 'vmaps_duplicate_post_as_draft',
					'post' => $post->ID,
					'post_type' => 'venomaps',
				),
				'admin.php'
			),
			basename( __FILE__ ),
		);

		$actions['duplicate'] = '<a href="' . esc_url( $url ) . '" title="Duplicate this item">Duplicate</a>';

		return $actions;
	}

	/**
	 * Duplicate post
	 */
	public function duplicate_post_as_draft() {

		if ( empty( $_GET['post'] ) ) {
			wp_die( 'No post to duplicate has been provided!' );
		}

		// Nonce verification.
		check_admin_referer( basename( __FILE__ ) );

		$post_id = absint( $_GET['post'] );
		$post = get_post( $post_id );

		// $current_user = wp_get_current_user();
		// $new_post_author = $current_user->ID;
		$new_post_author = $post->post_author;

		if ( $post ) {
			// new post data array.
			$args = array(
				// 'comment_status' => $post->comment_status,
				// 'ping_status'    => $post->ping_status,
				'post_author'    => $new_post_author,
				'post_content'   => $post->post_content,
				// 'post_excerpt'   => $post->post_excerpt,
				'post_name'      => $post->post_name,
				'post_parent'    => $post->post_parent,
				'post_password'  => $post->post_password,
				'post_status'    => 'draft', // $post->post_status,
				'post_title'     => $post->post_title . ' (' . __( 'Copy', 'venomaps' ) . ')',
				'post_type'      => $post->post_type,
				'to_ping'        => $post->to_ping,
				'menu_order'     => $post->menu_order,
			);

			// insert the post by wp_insert_post() function.
			$new_post_id = wp_insert_post( $args );

			// duplicate all post meta.
			$post_meta = get_post_meta( $post_id );
			if ( $post_meta ) {
				foreach ( $post_meta as $meta_key => $meta_values ) {
					// we need to exclude some system meta keys.
					if ( in_array( $meta_key, array( '_edit_lock', '_wp_old_slug' ) ) ) {
						continue;
					}
					// do not forget that each meta key can have multiple values.
					foreach ( $meta_values as $meta_value ) {
						add_post_meta( $new_post_id, $meta_key, maybe_unserialize( $meta_value ) );
					}
				}
			}

			// or we can redirect to all posts with a message.
			wp_safe_redirect(
				add_query_arg(
					array(
						'post_type' => 'venomaps',
						'saved' => 'post_duplicate_created', // just a custom slug here.
					),
					admin_url( 'edit.php' )
				)
			);
			exit;

		} else {
			wp_die( 'We can not duplicate the post because we can not find it.' );
		}
	}

	/**
	 * Post duplicated message
	 */
	public function duplication_admin_notice() {
		$screen = get_current_screen();
		if ( 'edit' !== $screen->base ) {
			return;
		}

		if ( isset( $_GET['saved'] ) && 'post_duplicate_created' === $_GET['saved'] ) { ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Copy created', 'venomaps' ); ?></p></div>;
			<?php
		}
	}

	/**
	 * Update post meta from CSV
	 */
	public function set_csv() {
		$nonce = filter_input( INPUT_POST, 'vmap_nonce', FILTER_SANITIZE_SPECIAL_CHARS );
		if ( ! wp_verify_nonce( $nonce, 'vmap-ajax-nonce' ) ) {
			$response = __( 'Error: please reload the page', 'venomaps' );
			echo wp_json_encode( $response );
			wp_die();
			exit();
		}
		$url = filter_input( INPUT_POST, 'url', FILTER_SANITIZE_SPECIAL_CHARS );
		$post_id = filter_input( INPUT_POST, 'post_id', FILTER_SANITIZE_SPECIAL_CHARS );

		$delimiters = array( ',', ';' );

		$delimiter = isset( $_POST['delimiter'] ) && ';' == $_POST['delimiter'] ? ';' : ',';

		$post_meta = $this->parse_csv( $url, $delimiter );

		if ( $post_meta ) {
			update_post_meta( $post_id, 'venomaps_marker', $post_meta );
			$response = __( 'Markers successfully imported. Reload the page', 'venomaps' );
		} else {
			$response = __( 'Error, invalid file', 'venomaps' );
		}

		echo wp_json_encode( $response );
		wp_die();
		exit;
	}

	/**
	 * Parse CSV
	 *
	 * @param string $file      url of the file.
	 * @param string $delimiter url delimiter , or ;.
	 *
	 * @return parsed file
	 */
	public function parse_csv( $file, $delimiter ) {
		$handle = fopen( $file, 'r' );
		$counter = 0;
		$keys = array();
		$parsed = array();

		while ( ( $row = fgetcsv( $handle, null, $delimiter ) ) !== false ) {
			if ( 0 === $counter ) {
				$keys_values = array_values( $row );
				$settings_values = array_keys( $this->default_settings );

				$keys = $keys_values;
				$settings = $settings_values;

				sort( $keys_values );
				sort( $settings_values );

				// Wrong file format.
				if ( $settings_values != $keys_values ) {
					return false;
				}

				$counter++;
				continue;
			}
			$fragments = array_values( $row );
			$current = array();
			foreach ( $fragments as $fragment_number => $value ) {
				$current[ $keys[ $fragment_number ] ] = $value;
			}
			$parsed[] = $current;
		}
		fclose( $handle );
		return $parsed;
	}

	/**
	 * Registra il tipo di blocco e lo script dell'editor con le sue dipendenze.
	 */
	public function register_venomaps_block() {

		// 1. Registra il tipo di blocco usando i metadati del file block.json.
		// Assicurati che il percorso punti alla DIRECTORY che contiene block.json.
		register_block_type( __DIR__ . '/block' );

		// 2. Registra lo script dell'editor, specificando le dipendenze corrette.
		// Questo è il passaggio chiave che risolve l'errore 'window.wp is undefined'.
		wp_register_script(
			'venomaps-block', // Handle - DEVE corrispondere a "editorScript" in block.json
			plugins_url( 'block/block.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components' ),
			VENOMAPS_VERSION,
			true
		);
	}

	/**
	 * Passa i dati da PHP a JavaScript per l'editor di blocchi.
	 */
	public function localize_venomaps_block_data() {

		// Prepara i dati necessari per lo script.
		$args = array(
			'post_type'   => 'venomaps',
			'numberposts' => -1,
			'fields'      => 'ids',
			'post_status' => 'publish',
		);
		$olmaps   = get_posts( $args );
		$templist = array();
		foreach ( $olmaps as $mapid ) {
			$templist[ $mapid ] = get_the_title( $mapid );
		}

		$venomaps_vars = array(
			'templates'          => wp_json_encode( $templist ),
			'_select_map'        => __( 'Select a map to display', 'venomaps' ),
			'_map_height'        => __( 'Map Height', 'venomaps' ),
			'_units'             => __( 'units', 'venomaps' ),
			'_clusters_background' => __( 'Clusters background', 'venomaps' ),
			'_clusters_color'    => __( 'Clusters color', 'venomaps' ),
			'_zoom_scroll'       => __( 'Mouse wheel zoom', 'venomaps' ),
			'_initial_zoom'      => __( 'Initial zoom', 'venomaps' ),
			'_search'            => __( 'Search markers', 'venomaps' ),
		);

		// Attacca i dati all'handle dello script del nostro blocco.
		wp_localize_script( 'venomaps-block', 'venomapsBlockVars', $venomaps_vars );
	}

	/**
	 * Load text domain
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'venomaps', false, basename( dirname( __DIR__ ) ) . '/languages/' );
	}

	/**
	 * Load front-end scripts
	 *
	 * @return void
	 */
	public function register_scripts() {
		wp_enqueue_style( 'venomaps', plugins_url( 'css/venomaps-bundle.css', __FILE__ ), array(), VENOMAPS_VERSION );
		wp_register_script( 'venomaps', plugins_url( 'js/venomaps-bundle.js', __FILE__ ), array(), VENOMAPS_VERSION, true );
	}

	/**
	 * Return the map style data
	 *
	 * @param string $stylemeta Value saved to db.
	 * @return array Url + Attribution.
	 */
	public function get_style_data( $stylemeta ) {
		$styles = $this->available_styles();
		$pieces = explode( '_', $stylemeta, 2 );
		$styleurl = false;

		$style_group = isset( $pieces[0] ) ? $pieces[0] : false;
		$style_key = isset( $pieces[1] ) ? $pieces[1] : false;

		$styleurl = ( $style_group && $style_key && isset( $styles[ $style_group ]['maps'][ $style_key ]['url'] ) ) ? $styles[ $style_group ]['maps'][ $style_key ]['url'] : 'default';
		$styleurl = strlen( $styleurl ) ? $styleurl : 'default';

		$attribution = '';

		if ( isset( $styles[ $style_group ]['attribution'] ) ) {
			$attribution .= '&copy;';
			foreach ( $styles[ $style_group ]['attribution'] as $attrib ) {
				$attribution .= ' <a href="' . $attrib['link'] . ' target="_blank">' . $attrib['title'] . '</a> |';
			}
		}
		return array(
			'url' => $styleurl,
			'attribution' => $attribution,
			'group' => $style_group,
			'key' => $style_key,
		);
	}

	/**
	 * Handle the [venomaps] shortcode
	 *
	 * @param array $atts Array of shortcode attributes.
	 * @return string Form html + application.
	 */
	public function venomaps_do_shortcode( $atts = array() ) {

		self::$mapscounter++;

		$args = shortcode_atts(
			array(
				'id' => 0,
				'height' => '500px',
				'cluster_bg' => '#009CD7',
				'cluster_color' => '#FFFFFF',
				'zoom' => 10,
				'scroll' => 0,
				'search' => 0,
				// 'tags' => '',
			),
			$atts
		);

		$map_id = (int) esc_attr( $args['id'] );

		if ( ! $map_id ) {
			$output = '<h4>- ' . __( 'No map selected', 'venomaps' ) . ' -</h4>';
			return $output;
		}

		$height = esc_attr( $args['height'] );
		$map_height = strlen( $height ) ? $height : '500px';
		$cluster_color = esc_attr( $args['cluster_color'] );
		$cluster_bg = esc_attr( $args['cluster_bg'] );

		$zoom = esc_attr( $args['zoom'] );
		$zoom_scroll = (int) esc_attr( $args['scroll'] );
		$search = (bool) esc_attr( $args['search'] );

		// $taglist = esc_attr( $args['tags'] );
		// $tags = strlen( $taglist ) ? array_map( 'trim', explode( ',', $taglist ) ) : false;

		$html_map_id = $map_id . '_' . self::$mapscounter;

		// Map Coordinates.
		$lat = get_post_meta( $map_id, 'venomaps_lat', true );
		$lat = $lat ? $lat : $this->default_coords['lat'];
		$lon = get_post_meta( $map_id, 'venomaps_lon', true );
		$lon = $lon ? $lon : $this->default_coords['lon'];

		$routes = get_post_meta( $map_id, 'venomaps_routes', true );

		$stylemeta = get_post_meta( $map_id, 'venomaps_style', true );
		$styledata = $this->get_style_data( $stylemeta );

		$styleurl = $styledata['url'];
		$attribution = $styledata['attribution'];
		$style_key = $styledata['key'];

		// Load front-end scripts.
		wp_enqueue_script( 'venomaps' );

		// ** NUOVA LOGICA: Inizializza le coordinate di destinazione **
		$destination_coords = false;

		// Ottieni i marker per trovare la destinazione
		$marker_settings = get_post_meta( $map_id, 'venomaps_marker', true );

		$map_data = array(
			'mapid' => $html_map_id,
			'lat' => $lat,
			'lon' => $lon,
			'style_url' => urlencode( $styleurl ),
			'zoom' => $zoom,
			'zoom_scroll' => $zoom_scroll,
			'stylekey' => $style_key,
			'cluster_color' => $cluster_color,
			'cluster_bg' => $cluster_bg,
			// ** NUOVO: Aggiungi le coordinate di destinazione ai dati della mappa **
			'destination' => $destination_coords,
			'routes' => $routes,
		);

		$infobox_index = 0;
		$markers_output = '';

		// Output markers and infoboxes.
		if ( $marker_settings ) {

			$marker_list = '<datalist id="vmap-suggestions-' . $html_map_id . '">';

			$marker_index = 0;

			foreach ( $marker_settings as $marker ) {

				$key = $marker_index;
				$marker_data = array();

				$marker_size = isset( $marker['size'] ) && strlen( $marker['size'] ) ? $marker['size'] : $this->default_settings['size'];
				$marker_color = isset( $marker['color'] ) && strlen( $marker['color'] ) ? $marker['color'] : '#000000';

				$svgicon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" fill="currentColor" viewBox="0 0 30 30" xml:space="preserve"><path fill="#ffffff" d="M15,0C8.1,0,2.5,5.5,2.5,12.3S8,23.9,15,30c7-6.1,12.5-10.9,12.5-17.7S21.9,0,15,0z"/><path fill="' . $marker_color . '" d="M15,1C8.7,1,3.5,6.1,3.5,12.3S8.3,22.8,15,28.7c6.7-5.9,11.5-10.2,11.5-16.4S21.3,1,15,1z M15,17.2 c-2.5,0-4.6-2.1-4.6-4.6c0-2.5,2.1-4.6,4.6-4.6s4.6,2.1,4.6,4.6C19.6,15.1,17.5,17.2,15,17.2z"/></svg>';

				$svgicon_encoded = 'data:image/svg+xml;base64,' . base64_encode( $svgicon );

				$marker_icon = isset( $marker['icon'] ) && strlen( $marker['icon'] ) ? $marker['icon'] : $svgicon_encoded;

				$infobox = isset( $marker['infobox'] ) && strlen( $marker['infobox'] ) ? nl2br( $marker['infobox'] ) : '';

				$marker_data['icon'] = $marker_icon;
				$marker_data['lat'] = $marker['lat'];
				$marker_data['lon'] = $marker['lon'];
				$marker_data['size'] = $marker_size;

				$infobox_open = 1 === $marker['infobox_open'] ? ' was-open' : ' infobox-closed';

				if ( strlen( $infobox ) ) {

					$infobox_index++;

					$markers_output .= '<div class="wpol-infopanel' . $infobox_open . '" id="infopanel_' . $html_map_id . '_' . $key . '" >';
					$markers_output .= '<div class="wpol-infolabel">' . wp_kses_post( $infobox ) . '</div>';
					$markers_output .= '<div class="wpol-arrow"></div><div class="wpol-infopanel-close"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg></div></div>';
					// sugestions.
					$anitized_infobox = sanitize_text_field( $infobox );
					$cut_string = 64;
					$threedots = strlen( $anitized_infobox ) > $cut_string ? '...' : '';
					$marker_list .= '<option value="' . $anitized_infobox . '">' . substr( $anitized_infobox, 0, $cut_string ) . $threedots . '</option>';
				}
				$markers_output .= '<div class="wpol-infomarker" data-paneltarget="' . $html_map_id . '_' . $key . '" data-marker=\'' . wp_json_encode( $marker_data ) . '\' id="infomarker_' . $html_map_id . '_' . $key . '"><img src="' . $marker_data['icon'] . '" style="height: ' . $marker_size . 'px; opacity:0.2"></div>';

				$marker_index++;
			}

			$marker_list .= '</datalist>';

		}

		$map_navbar = '';

		if ( $search && $infobox_index > 1 ) {
			$map_navbar .= '<div class="vmap-input-group">';
			$map_navbar .= '<div class="vmap-flex-grow"><input type="text" utocomplete="off" class="venomaps-search venomaps-form-control" list="vmap-suggestions-' . $html_map_id . '" id="search-venomap-' . $html_map_id . '" placeholder="' . __( 'Search', 'venomaps' ) . '"></div>';
			$map_navbar .= '<div class="vmap-input-group-text"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
</svg></div>';

			if ( $destination_coords ) {
				$map_navbar .= '<button id="get-directions-' . $html_map_id . '" class="venomaps-get-directions" style="margin-left: 10px;">' . __( 'Get Directions', 'venomaps' ) . '</button>';
			}
			$map_navbar .= '</div><!-- end group -->';
		}

		$output = '<div class="wrap-venomaps" data-infomap=\'' . wp_json_encode( $map_data ) . '\'>';

		$output .= $map_navbar;

		$output .= '<div id="venomaps_' . $html_map_id . '" class="venomap" style="height: ' . $map_height . ';"></div>';
		$output .= '<div style="display: none;" id="wrap-overlay-' . $html_map_id . '">';

		$output .= $markers_output;

		$output .= '<div class="venomaps-get-attribution">' . $attribution . '</div>';
		$output .= '</div>';

		$output .= $marker_list;
		$output .= '</div>';

		return $output;
	}
	/**
	 * Add links to settings page
	 *
	 * @param array $links default plugin links.
	 *
	 * @return additional $links in plugins page
	 */
	public function action_links( $links ) {
		$links[] = '<a href="' . esc_url( get_admin_url( null, 'options-general.php?page=venomaps' ) ) . '">' . __( 'Settings', 'venomaps' ) . '</a>';
		return $links;
	}

	/**
	 * Register venomaps custom post type
	 */
	public function register_cpt() {
		// Register venomaps post type.
		$venomaps_cpt_labels = array(
			'name' => _x( 'VenoMaps', 'post type general name', 'venomaps' ),
			'singular_name' => _x( 'Map', 'post type singular name', 'venomaps' ),
			'add_new' => __( 'Add new', 'venomaps' ),
			'add_new_item' => __( 'Add new', 'venomaps' ),
			'edit_item' => __( 'Edit map', 'venomaps' ),
			'new_item' => __( 'New map', 'venomaps' ),
			'all_items' => __( 'All maps', 'venomaps' ),
			'view_item' => __( 'View map', 'venomaps' ),
			'search_items' => __( 'Search maps', 'venomaps' ),
			'not_found' => __( 'No map found.', 'venomaps' ),
			'not_found_in_trash' => __( 'No Maps found in trash.', 'venomaps' ),
			'menu_name' => __( 'VenoMaps', 'venomaps' ),
		);

		$venomaps_cpt_args = array(
			'labels' => $venomaps_cpt_labels,
			// 'rewrite' => true,
			'rewrite' => array(
				'slug' => 'venomaps',
			),
			'has_archive' => false,
			'hierarchical' => false,
			'map_meta_cap' => true,
			'menu_position' => null,
			'supports' => array( 'title' ),
			'menu_icon' => 'dashicons-location-alt',
			'show_in_rest' => false, // disable Gutenberg editor.
			'public' => false, // $exclude_from_search, $publicly_queryable, $show_ui, and $show_in_nav_menus are inherited from public.
			'show_ui' => true,
		);

		register_post_type( 'venomaps', $venomaps_cpt_args );
	}

	/**
	 * Get available map styles
	 */
	public function available_styles() {
		$settings = get_option( 'venomaps_settings', array() );
		$provider_styles = array(
			'default' => $this->all_styles['default'],
		);

		$all_styles = $this->all_styles;

		// Get styles from providers with api key.
		if ( isset( $settings['map_key'] ) && is_array( $settings['map_key'] ) ) {
			foreach ( $settings['map_key'] as $provider => $api_key ) {
				if ( strlen( $api_key ) ) {
					$provider_styles[ $provider ] = $this->all_styles[ $provider ];

					foreach ( $provider_styles[ $provider ]['maps'] as $provider_key => $map_style ) {
						$provider_styles[ $provider ]['maps'][ $provider_key ]['url'] .= $api_key;
					}
				}
			}
		}

		$custom_styles = isset( $settings['style'] ) && is_array( $settings['style'] ) ? $settings['style'] : array();

		foreach ( $custom_styles as $key => $value ) {
			$provider_styles['custom']['maps'][ 'custom' . $key ] = $value;
		}

		return $provider_styles;
	}

	/**
	 * Rewrite permalinks on activation, after cpt registration
	 */
	public function activate_plugin() {
		$this->register_cpt();
		flush_rewrite_rules();

		// Set activation date for new installations.
		$option_name = $this->slug . '_activation_date';
		if ( false === get_option( $option_name ) ) {
			add_option( $option_name, time() );
		}
	}

	/**
	 * Check and set the installation date if it doesn't exist.
	 * This ensures that the notice timer starts for existing users who update the plugin.
	 *
	 * @return void
	 */
	public function check_installation_date() {
		$option_name = $this->slug . '_activation_date';
		if ( false === get_option( $option_name ) ) {
			add_option( $option_name, time() );
		}
	}

	/**
	 * Display the review notice in the admin dashboard.
	 *
	 * @return void
	 */
	public function display_review_notice() {
		// Only show notice to users who can manage options.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$dismissed_option = $this->slug . '_review_notice_dismissed';
		$activation_option = $this->slug . '_activation_date';

		// Check if the notice has been dismissed.
		if ( get_option( $dismissed_option ) ) {
			return;
		}

		$activation_date = get_option( $activation_option );

		// Show notice only after 14 days of usage.
		if ( ! $activation_date || ( time() - $activation_date < 14 * DAY_IN_SECONDS ) ) {
			return;
		}

		// Enqueue the script for the notice.
		$this->enqueue_review_notice_script();

		// Dynamic CSS IDs and classes.
		$notice_id     = $this->slug . '-review-notice';
		$dismiss_class = $this->slug . '-dismiss-notice';
		$review_url    = 'https://wordpress.org/support/plugin/' . $this->slug . '/reviews/?filter=5';
		?>
		<div id="<?php echo esc_attr( $notice_id ); ?>" class="notice notice-info is-dismissible">
			<p>
				<?php
				printf(
					/* translators: %s is the plugin name */
					esc_html__( 'Enjoying %s? Please consider leaving a 5-star review ⭐⭐⭐⭐⭐. It helps us grow and support the plugin!', 'venomaps' ),
					'<strong>' . esc_html( $this->plugin_name ) . '</strong>'
				);
				?>
			</p>
			<p>
				<a href="<?php echo esc_url( $review_url ); ?>" class="button button-primary" target="_blank">
					<?php esc_html_e( 'Sure, I’d love to!', 'venomaps' ); ?>
				</a>
				<a href="#" class="button button-secondary <?php echo esc_attr( $dismiss_class ); ?>">
					<?php esc_html_e( 'Maybe Later', 'venomaps' ); ?>
				</a>
				<a href="#" class="button button-secondary <?php echo esc_attr( $dismiss_class ); ?>">
					<?php esc_html_e( 'I Already Rated It', 'venomaps' ); ?>
				</a>
			</p>
		</div>
		<?php
	}

	/**
	 * Enqueue the JavaScript for the review notice dismissal.
	 *
	 * @return void
	 */
	private function enqueue_review_notice_script() {
		// Dynamic script handle.
		$handle     = $this->slug . '-review-notice';
		$plugin_url = plugin_dir_url( __DIR__ );

		wp_enqueue_script(
			$handle,
			$plugin_url . 'include/js/admin-review-notice.js', // Adjust path if necessary.
			array(),
			VENOMAPS_VERSION,
			true
		);

		// Create a unique, JS-friendly object name from the slug.
		$object_name = 'venomapsReviewNoticeData';

		wp_localize_script(
			$handle,
			$object_name, // Use the unique object name here.
			array(
				'ajax_url'    => admin_url( 'admin-ajax.php' ),
				'nonce'       => wp_create_nonce( $this->slug . '_dismiss_review_notice_nonce' ),
				'action'      => $this->slug . '_dismiss_review_notice',
				'notice_id'   => $this->slug . '-review-notice',
				'dismiss_class' => $this->slug . '-dismiss-notice',
			)
		);
	}

	/**
	 * Handles the AJAX request to dismiss the review notice.
	 *
	 * @return void
	 */
	public function dismiss_review_notice() {
		// Dynamic nonce check and option update.
		check_ajax_referer( $this->slug . '_dismiss_review_notice_nonce', 'nonce' );
		update_option( $this->slug . '_review_notice_dismissed', true );
		wp_send_json_success();
	}
} // end class

// Call options.
Venomaps_Plugin::get_instance();
