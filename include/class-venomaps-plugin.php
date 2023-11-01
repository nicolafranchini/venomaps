<?php
/**
 * Plugin class
 */
class Venomaps_Plugin {

	/**
	 * Plugin name
	 *
	 * @var slug
	 */
	private $slug = 'venomaps';

	/**
	 * Refers to a single instance of this class.
	 *
	 * @var $instance
	 */
	private static $instance = null;

	/**
	 * Counts decks on page
	 *
	 * @var $mapscounter
	 */
	private static $mapscounter = 0;

	/**
	 * Default map styles.
	 *
	 * @var $all_styles
	 */
	private $all_styles = array(
		'default' => array(
			'name' => 'Default',
			'url' => 'default',
		),
		'maptiler' => array(
			'backdrop' => array(
				'name' => 'Backdrop',
				'url' => 'https://api.maptiler.com/maps/backdrop/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'basic' => array(
				'name' => 'Basic',
				'url' => 'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'ocean' => array(
				'name' => 'Ocean',
				'url' => 'https://api.maptiler.com/maps/ocean/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'satellite' => array(
				'name' => 'Satellite',
				'url' => 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'streets' => array(
				'name' => 'Streets',
				'url' => 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'toner' => array(
				'name' => 'Toner',
				'url' => 'https://api.maptiler.com/maps/toner-v2/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'topo' => array(
				'name' => 'Topo',
				'url' => 'https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'winter' => array(
				'name' => 'Winter',
				'url' => 'https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=',
				'attribution' => '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
		),
		'stadiamaps' => array(
			'terrain' => array(
				'name' => 'Terrain',
				'url' => 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png?api_key=',
				'attribution' => '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'toner' => array(
				'name' => 'Toner',
				'url' => 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}@2x.png?api_key=',
				'attribution' => '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
			'watercolor' => array(
				'name' => 'Watercolor',
				'url' => 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=',
				'attribution' => '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
			),
		),
		'thunderforest' => array(
			'atlas' => array(
				'name' => 'Atlas',
				'url' => 'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'landscape' => array(
				'name' => 'Landscape',
				'url' => 'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'mobile_atlas' => array(
				'name' => 'Mobile Atlas',
				'url' => 'https://tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'neighbourhood' => array(
				'name' => 'Neighbourhood',
				'url' => 'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'opencyclemap' => array(
				'name' => 'Open Cycle',
				'url' => 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'outdoors' => array(
				'name' => 'Outdoors',
				'url' => 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'pioneer' => array(
				'name' => 'Pioneer',
				'url' => 'https://tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'spinal' => array(
				'name' => 'Spinal',
				'url' => 'https://tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'transport' => array(
				'name' => 'Transport',
				'url' => 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
			),
			'transport_dark' => array(
				'name' => 'Transport Dark',
				'url' => 'https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=',
				'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap contributors</a>',
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
		register_activation_hook( dirname( __DIR__ ) . '/' . $this->slug . '.php', array( $this, 'rewrite_flush' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ), 10, 1 );
		add_action( 'add_meta_boxes', array( $this, 'add_metaboxes' ) );
		add_action( 'save_post', array( $this, 'save_metaboxes' ), 10, 2 );
		add_shortcode( 'venomap', array( $this, 'venomaps_do_shortcode' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'gutenberg_block' ) );
	}

	/**
	 * Enqueue Gutenberg block script
	 */
	public function gutenberg_block() {

		wp_register_script(
			'venomaps-block',
			plugins_url( 'block/venomaps-block.js', __FILE__ ),
			array(
				'wp-blocks',
				'wp-element',
				'wp-block-editor',
				'wp-components',
			),
			VENOMAPS_VERSION,
			true
		);

		$args = array(
			'post_type' => 'venomaps',
			'numberposts' => -1,
			'fields' => 'ids',
		);
		$olmaps = get_posts( $args );
		$templist = array();
		foreach ( $olmaps as $mapid ) {
			$templist[ $mapid ] = get_the_title( $mapid );
		}
		$venomaps_vars = array(
			'templates' => wp_json_encode( $templist ),
			'_select_map' => __( 'Select a map to display', 'venomaps' ),
			'_map_height' => __( 'Map Height', 'venomaps' ),
			'_units' => __( 'units', 'venomaps' ),
			'_clusters_background' => __( 'Clusters background', 'venomaps' ),
			'_clusters_color' => __( 'Clusters color', 'venomaps' ),
			'_zoom_scroll' => __( 'Enable mouse wheel zoom', 'venomaps' ),
			'_initial_zoom' => __( 'Initial zoom', 'venomaps' ),
		);
		wp_localize_script( 'venomaps-block', 'venomapsBlockVars', $venomaps_vars );
		wp_enqueue_script( 'venomaps-block' );
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

		if ( defined( 'WP_DEBUG' ) && true === WP_DEBUG ) {
			wp_enqueue_style( 'venomaps-ol', plugins_url( 'dev/ol/ol.css', __FILE__ ), array(), '7.3.0' );
			wp_enqueue_style( 'venomaps', plugins_url( 'dev/venomaps/venomaps.css', __FILE__ ), array(), VENOMAPS_VERSION );

			wp_register_script( 'venomaps-ol', plugins_url( 'dev/ol/ol.js', __FILE__ ), array(), '7.3.0', true );
			wp_register_script( 'venomaps', plugins_url( 'dev/venomaps/venomaps.js', __FILE__ ), array( 'venomaps-ol' ), VENOMAPS_VERSION, true );
		} else {
			wp_enqueue_style( 'venomaps', plugins_url( 'css/venomaps-bundle.min.css', __FILE__ ), array(), VENOMAPS_VERSION );
			wp_register_script( 'venomaps', plugins_url( 'js/venomaps-bundle.min.js', __FILE__ ), array(), VENOMAPS_VERSION, true );
		}
	}

	/**
	 * Load custom post scripts.
	 *
	 * @param string $hook page hook.
	 */
	public function load_admin_scripts( $hook ) {

		if ( in_array( $hook, array( 'post.php', 'post-new.php' ) ) ) {
			$screen = get_current_screen();

			wp_enqueue_style( 'venomaps-admin', plugins_url( 'css/venomaps-admin.css', __FILE__ ), array(), VENOMAPS_VERSION );

			if ( is_object( $screen ) && 'venomaps' == $screen->post_type ) {
				wp_enqueue_media();
				wp_enqueue_editor();

				wp_enqueue_style( 'venomaps-ol', plugins_url( 'dev/ol/ol.css', __FILE__ ), array(), '7.3.0' );
				wp_enqueue_script( 'venomaps-ol', plugins_url( 'dev/ol/ol.js', __FILE__ ), array(), '7.3.0', true );

				wp_enqueue_script( 'venomaps-admin', plugins_url( 'js/venomaps-admin.js', __FILE__ ), array( 'jquery', 'venomaps-ol' ), VENOMAPS_VERSION );
			}
		}
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
				'height' => '',
				'widget' => 0,
				'cluster_bg' => '#009CD7',
				'cluster_color' => '#FFFFFF',
				'zoom' => 12,
				'scroll' => 0,
			),
			$atts
		);

		$map_id = (int) esc_attr( $args['id'] );

		if ( ! $map_id ) {
			$output = '<h4>- ' . __( 'No map selected', 'venomaps' ) . ' -</h4>';
			return $output;
		}

		$widget = esc_attr( $args['widget'] );
		$height = esc_attr( $args['height'] );
		$map_height = strlen( $height ) ? $height : '500px';
		$cluster_color = esc_attr( $args['cluster_color'] );
		$cluster_bg = esc_attr( $args['cluster_bg'] );

		$zoom = esc_attr( $args['zoom'] );
		$zoom_scroll = (int) esc_attr( $args['scroll'] );

		$html_map_id = $map_id . '_' . self::$mapscounter;

		if ( strlen( $widget ) ) {
			$html_map_id .= '_' . $widget;
		}

		// Map Coordinates.
		$lat = get_post_meta( $map_id, 'venomaps_lat', true );
		$lat = $lat ? $lat : '40.712776';
		$lon = get_post_meta( $map_id, 'venomaps_lon', true );
		$lon = $lon ? $lon : '-74.005974';

		$styles = $this->available_styles();

		$stylekey = get_post_meta( $map_id, 'venomaps_style', true );

		$pieces = explode( '_', $stylekey );

		$style_group = $pieces[0];
		$style_key = $pieces[1];

		$styleurl = isset( $styles[ $style_group ][ $stylekey ]['url'] ) ? $styles[ $style_group ][ $stylekey ]['url'] : 'default';
		$styleurl = strlen( $styleurl ) ? $styleurl : 'default';
		$attribution = isset( $styles[ $style_group ][ $stylekey ]['attribution'] ) ? $styles[ $style_group ][ $stylekey ]['attribution'] : 0;

		// Load front-end scripts.
		wp_enqueue_script( 'venomaps' );

		$map_data = array(
			'mapid' => $html_map_id,
			'lat' => $lat,
			'lon' => $lon,
			'style_url' => $styleurl,
			// 'custom_style' => $custom_style,
			'zoom' => $zoom,
			'zoom_scroll' => $zoom_scroll,
			'stylekey' => $stylekey,
			'attribution' => $attribution,
			'cluster_color' => $cluster_color,
			'cluster_bg' => $cluster_bg,
		);

		$output = '<div class="wrap-venomaps" data-infomap=\'' . wp_json_encode( $map_data ) . '\'>';
		$output .= '<div id="venomaps_' . $html_map_id . '" class="venomap" style="height: ' . $map_height . ';"></div>';

		$output .= '<div style="display: none;" id="wrap-overlay-' . $html_map_id . '">';

		// Output markers and infoboxes.
		$marker_settings = get_post_meta( $map_id, 'venomaps_marker', true );

		if ( $marker_settings ) {
			foreach ( $marker_settings as $key => $marker ) {
				$marker_data = array();

				$marker_size = isset( $marker['size'] ) && strlen( $marker['size'] ) ? $marker['size'] : '30';
				$marker_icon = isset( $marker['icon'] ) && strlen( $marker['icon'] ) ? $marker['icon'] : plugins_url( '/images/marker.svg', __FILE__ );
				$infobox = isset( $marker['infobox'] ) && strlen( $marker['infobox'] ) ? $marker['infobox'] : '';

				$marker_data['icon'] = $marker_icon;
				$marker_data['lat'] = $marker['lat'];
				$marker_data['lon'] = $marker['lon'];
				$marker_data['size'] = $marker_size;

				$infobox_open = 1 === $marker['infobox_open'] ? ' was-open' : ' infobox-closed';

				if ( strlen( $infobox ) ) {
					$output .= '<div class="wpol-infopanel' . $infobox_open . '" id="infopanel_' . $html_map_id . '_' . $key . '" >';
					$output .= '<div class="wpol-infolabel">' . $infobox . '</div>';
					$output .= '<div class="wpol-arrow"></div><div class="wpol-infopanel-close"><img src="' . plugins_url( '/images/close-x.svg', __FILE__ ) . '"></div></div>';
				}

				$output .= '<div class="wpol-infomarker" data-paneltarget="' . $html_map_id . '_' . $key . '" data-marker=\'' . wp_json_encode( $marker_data ) . '\' id="infomarker_' . $html_map_id . '_' . $key . '"><img src="' . $marker_data['icon'] . '" style="height: ' . $marker_size . 'px; opacity:0.2"></div>';
			}
		}
		$output .= '</div></div>';

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
	 * Rewrite permalinks on activation, after cpt registration
	 */
	public function rewrite_flush() {
		$this->register_cpt();
		flush_rewrite_rules();
	}

	/**
	 * Adds the meta boxes.
	 */
	public function add_metaboxes() {
		add_meta_box(
			'venomaps_copy_shortcode',
			__( 'Map Shortcode', 'venomaps' ),
			array( $this, 'render_venomaps_shortcode_metabox' ),
			'venomaps',
			'normal',
			'high'
		);

		add_meta_box(
			'venomaps_map_box',
			__( 'Map Options', 'venomaps' ),
			array( $this, 'render_venomaps_map_metabox' ),
			'venomaps',
			'normal', // normal, side.
			'high'
		);

		add_meta_box(
			'venomaps_marker_box',
			__( 'Markers', 'venomaps' ),
			array( $this, 'render_venomaps_marker_metabox' ),
			'venomaps',
			'normal', // normal, side.
			'default' // high, default, low.
		);
		add_meta_box(
			'venomaps_geolocation_box',
			__( 'Geolocation', 'venomaps' ),
			array( $this, 'render_venomaps_geolocation_metabox' ),
			'venomaps',
			'side', // normal, side.
			'default' // high, default, low.
		);
	}

	/**
	 * Render the metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_geolocation_metabox( $post ) {
		?>
		<p><?php esc_html_e( 'Search an address or drag the marker to adjust the position and get the coordinates', 'venomaps' ); ?></p>
			<fieldset>
				<div class="wpol-form-group">
					<input type="text" class="widefat venomaps-set-address" value="" placeholder="Type a place address"> 
				</div>
				<div class="wpol-form-group">
					<div class="venomaps-response"></div>
					<div class="button venomaps-get-coordinates"><span class="dashicons dashicons-search"></span> <?php esc_html_e( 'Search', 'venomaps' ); ?></div>
				</div>
			</fieldset>
			<fieldset>
				<div class="wpol-form-group">
					<span class="description"><?php esc_html_e( 'Latitude', 'venomaps' ); ?></span>
					<input type="text" class="widefat venomaps-get-lat" value="" placeholder="Latitude">
					<span class="description"><?php esc_html_e( 'Longitude', 'venomaps' ); ?></span>
					<input type="text" class="widefat venomaps-get-lon" value="" placeholder="Longitude">
				</div>
			</fieldset>

			<div id="wpol-admin-map" class="venomap"></div>
			<div style="display:none;">
				<div class="wpol-infomarker" id="infomarker_admin"></div>
			</div>	
		<?php
	}

	/**
	 * Render shortcode field metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_shortcode_metabox( $post ) {
		?>
		<fieldset>
			<input type="text" class="large-text" name="" value='[venomap id="<?php echo esc_attr( $post->ID ); ?>" height="500px" zoom="12"]' readonly>
		</fieldset>
		<p><?php esc_html_e( 'Copy the shortcode and paste it inside your Posts or Pages, or search VenoMaps among Blocks to set more options', 'venomaps' ); ?></p>
		<?php
	}

	/**
	 * Get available map styles
	 */
	public function available_styles() {
		$settings = get_option( 'venomaps_settings', array() );

		$provider_styles = array(
			'default' => $this->all_styles['default'],
		);

		// Get styles from providers with api key.
		foreach ( $settings['map_key'] as $provider => $api_key ) {
			if ( strlen( $api_key ) ) {
				foreach ( $this->all_styles[ $provider ] as $provider_key => $map_style ) {
					$map_style['url'] .= $api_key;
					$provider_styles[ $provider ][ $provider . '_' . $provider_key ] = $map_style;
				}
			}
		}

		$custom_styles = isset( $settings['style'] ) && is_array( $settings['style'] ) ? $settings['style'] : array();

		foreach ( $custom_styles as $key => $value ) {
			$provider_styles['custom'][ 'custom_' . $key ] = $value;
		}

		return $provider_styles;
	}

	/**
	 * Render map metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_map_metabox( $post ) {

		wp_nonce_field( 'venomaps_metaboxes', 'venomaps_nonce' );

		// Map coordinates.
		$lat = get_post_meta( $post->ID, 'venomaps_lat', true );
		$lat = $lat ? $lat : '40.712776';
		$lon = get_post_meta( $post->ID, 'venomaps_lon', true );
		$lon = $lon ? $lon : '-74.005974';

		// Map style.
		$stylekey = get_post_meta( $post->ID, 'venomaps_style', true );
		// $settings = get_option( 'venomaps_settings', array() );
		// $custom_styles = isset( $settings['style'] ) && is_array( $settings['style'] ) ? $settings['style'] : array();

		$styles = $this->available_styles();
		?>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Style', 'venomaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
				<select name="venomaps_style" class="all-options">
				<?php
				foreach ( $styles as $key => $value ) {
					if ( isset( $value['url'] ) && strlen( $value['url'] ) ) {
						?>
						<option <?php selected( $stylekey, $key ); ?> value="<?php echo esc_attr( $key ); ?>"><?php echo esc_attr( $value['name'] ); ?></option>
						<?php
					} elseif ( is_array( $value ) ) {
						echo '<optgroup label="' . esc_attr( $key ) . '">';
						foreach ( $value as $sub_key => $sub_value ) {
							if ( isset( $sub_value['url'] ) && strlen( $sub_value['url'] ) ) {
								?>
							<option <?php selected( $stylekey, $sub_key ); ?> value="<?php echo esc_attr( $sub_key ); ?>"><?php echo esc_attr( $sub_value['name'] ); ?></option>
								<?php
							}
						}
						echo '</optgroup>';
					}
				}
				?>
				</select>
				</div>
			</fieldset>
		</div>
		<?php // translators: "Settings Page" is the link to plugins settings page. ?>
		<p><?php printf( __( 'Add more Map Styles inside %1$sSettings Page%2$s.', 'venomaps' ), '<a target="_blank" href="' . esc_url( get_admin_url( null, 'options-general.php?page=venomaps' ) ) . '">', '</a>' ); // XSS ok. ?></p>
		<hr>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Coordinates', 'venomaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
					<input type="text" class="all-options" name="venomaps_lat" value="<?php echo esc_attr( $lat ); ?>">
					<span class="description"><?php esc_html_e( 'Latitude', 'venomaps' ); ?></span>
					<input type="text" class="all-options" name="venomaps_lon" value="<?php echo esc_attr( $lon ); ?>">
					<span class="description"><?php esc_html_e( 'Longitude', 'venomaps' ); ?></span>
				</div>
				<p><?php esc_html_e( 'Get coordinates from the Geolocation box', 'venomaps' ); ?></p>
			</fieldset>
		</div>
		<?php
	}

	/**
	 * Render markers metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_marker_metabox( $post ) {

		// delete_post_meta( $post->ID, 'venomaps_marker' ); // debug.

		$marker_settings = get_post_meta( $post->ID, 'venomaps_marker', true );

		$output_settings = array();

		$default_settings = array(
			array(
				'lat' => '',
				'lon' => '',
				'size' => '',
				'icon' => '',
				'infobox' => '',
				'infobox_open' => 0,
			),
		);

		if ( $marker_settings ) {
			foreach ( $marker_settings as $key => $setting ) {
				if ( isset( $setting['lat'] ) && ! empty( $setting['lat'] ) && isset( $setting['lon'] ) && ! empty( $setting['lon'] ) ) {
					$output_settings[] = $setting;
				}
			}
		}
		if ( ! isset( $output_settings[0] ) || empty( $output_settings[0] ) ) {
			$output_settings = $default_settings;
		}

		?>
		<div class="wrap-marker">
		<?php

		foreach ( $output_settings as $key => $setting ) {

			if ( $key > 0 ) {
				?>
			<div class="wrap-clone" id="wrap-clone-<?php echo esc_attr( $key ); ?>">
				<?php
			}
			?>
				<strong class="wpol-badge"> #<?php echo esc_attr( $key ); ?></strong>
				<div class="clone-marker" data-index="<?php echo esc_attr( $key ); ?>">
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Coordinates', 'venomaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<input type="text" class="all-options" name="venomaps_marker[<?php echo esc_attr( $key ); ?>][lat]" value="<?php echo esc_attr( $setting['lat'] ); ?>">
								<span class="description"><?php esc_html_e( 'Latitude', 'venomaps' ); ?></span>
								<input type="text" class="all-options" name="venomaps_marker[<?php echo esc_attr( $key ); ?>][lon]" value="<?php echo esc_attr( $setting['lon'] ); ?>">
								<span class="description"><?php esc_html_e( 'Longitude', 'venomaps' ); ?></span>
							</div>
						</fieldset>
					</div>
					<hr>
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Size', 'venomaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<select name="venomaps_marker[<?php echo esc_attr( $key ); ?>][size]" class="">
									<option <?php selected( $setting['size'], '30' ); ?> value="30"><?php esc_html_e( 'Small', 'venomaps' ); ?></option>
									<option <?php selected( $setting['size'], '40' ); ?> value="40"><?php esc_html_e( 'Medium', 'venomaps' ); ?></option>
									<option <?php selected( $setting['size'], '60' ); ?> value="60"><?php esc_html_e( 'Large', 'venomaps' ); ?></option>
									<option <?php selected( $setting['size'], '80' ); ?> value="80"><?php esc_html_e( 'Extra Large', 'venomaps' ); ?></option>
								</select>
							</div>
						</fieldset>
					</div>
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Custom Marker', 'venomaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<div class="venomaps_custom_marker-wrap">
								<input type="url" class="all-options venomaps_custom_marker" name="venomaps_marker[<?php echo esc_attr( $key ); ?>][icon]" value="<?php echo esc_attr( $setting['icon'] ); ?>">
									<button type="button" class="wpol-btn-link venomaps_marker_remove_btn"><span class="dashicons dashicons-no-alt"></span></button>
								</div>
								<button type="button" class="button venomaps_marker_upload_btn"><?php esc_html_e( 'Upload Media', 'venomaps' ); ?></button>
							</div>
						</fieldset>
					</div>

					<hr>
					<p><strong><?php esc_html_e( 'Info Box', 'venomaps' ); ?></strong></p>
					<div class="wpol-form-group">
						<label>
							<input type="checkbox" name="venomaps_marker[<?php echo esc_attr( $key ); ?>][infobox_open]" value="1" <?php checked( $setting['infobox_open'], 1 ); ?> />
							<span class="description"><?php esc_html_e( 'Visible panel', 'venomaps' ); ?></span>
						</label>
					</div>
				</div> <!-- end clone -->

				<div class="wp-editor-container venomaps_marker_editor">
					<textarea id="venomaps_infobox_<?php echo esc_attr( $key ); ?>" name="venomaps_marker[<?php echo esc_attr( $key ); ?>][infobox]" class="wp-editor-area" rows="4">
						<?php echo wp_kses_post( $setting['infobox'] ); ?>
					</textarea>
				</div>

			<?php
			if ( $key > 0 ) {
				?>
				<div class="wpol-remove-marker wpol-btn-link"><span class="dashicons dashicons-no"></span></div>
			</div>
				<?php
			}
		}
		?>
		</div> <!-- end wrap -->
		<div class="button wpol-new-marker"><?php esc_html_e( 'New marker', 'venomaps' ); ?></div>
		<?php
	}

	/**
	 * Handles saving the meta box.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @return null
	 */
	public function save_metaboxes( $post_id, $post ) {

		// Check if our nonce is set.
		if ( ! isset( $_POST['venomaps_nonce'] ) ) {
			return $post_id;
		}

		$nonce = filter_input( INPUT_POST, 'venomaps_nonce', FILTER_SANITIZE_SPECIAL_CHARS );

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'venomaps_metaboxes' ) ) {
			return $post_id;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}

		$allowed = wp_kses_allowed_html();

		$lat = filter_input( INPUT_POST, 'venomaps_lat', FILTER_SANITIZE_SPECIAL_CHARS );
		$lat = $lat ? esc_attr( $lat ) : '40.712776';
		update_post_meta( $post_id, 'venomaps_lat', $lat );

		$lon = filter_input( INPUT_POST, 'venomaps_lon', FILTER_SANITIZE_SPECIAL_CHARS );
		$lon = $lon ? esc_attr( $lon ) : '-74.005974';
		update_post_meta( $post_id, 'venomaps_lon', $lon );

		$style = filter_input( INPUT_POST, 'venomaps_style', FILTER_SANITIZE_SPECIAL_CHARS );
		update_post_meta( $post_id, 'venomaps_style', $style );

		$postvar = isset( $_POST['venomaps_marker'] ) ? wp_unslash( $_POST['venomaps_marker'] ) : array(); // XSS ok.

		$newmarkervars = array();

		foreach ( $postvar as $key => $value ) {

			if ( isset( $value['lat'] ) && isset( $value['lon'] ) ) {

				$markervars['lat'] = esc_attr( $value['lat'] );
				$markervars['lon'] = esc_attr( $value['lon'] );
				$markervars['size'] = isset( $value['size'] ) ? esc_attr( $value['size'] ) : '30';
				$markervars['icon'] = isset( $value['icon'] ) ? esc_url_raw( $value['icon'] ) : '';
				$markervars['infobox'] = wp_kses_post( $value['infobox'] );
				$markervars['infobox_open'] = isset( $value['infobox_open'] ) ? 1 : 0;

				if ( strlen( $markervars['lat'] ) && strlen( $markervars['lon'] ) ) {
					$newmarkervars[ $key ] = $markervars;
				}
			}
		}
		update_post_meta( $post_id, 'venomaps_marker', $newmarkervars );
	}
} // end class

// Call options.
Venomaps_Plugin::get_instance();
