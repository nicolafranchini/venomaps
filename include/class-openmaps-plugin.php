<?php
/**
 * Plugin class
 */
class Openmaps_Plugin {

	/**
	 * Plugin name
	 *
	 * @var slug
	 */
	private $slug = 'openmaps';

	/**
	 * Refers to a single instance of this class.
	 *
	 * @var $instance
	 */
	private static $instance = null;

	/**
	 * Creates or returns an instance of this class.
	 *
	 * @return  Openmaps_Plugin a single instance of this class.
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
		require dirname( __FILE__ ) . '/class-openmaps-options.php';
		require dirname( __FILE__ ) . '/class-openmaps-widget.php';
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
		register_activation_hook( dirname( dirname( __FILE__ ) ) . '/' . $this->slug . '.php', array( $this, 'rewrite_flush' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ), 10, 1 );

		add_action( 'add_meta_boxes', array( $this, 'add_metaboxes' ) );
		add_action( 'save_post', array( $this, 'save_metaboxes' ), 10, 2 );

		add_shortcode( 'openmap', array( $this, 'openmaps_do_shortcode' ) );

		add_action( 'widgets_init', array( $this, 'register_widget' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'gutenberg_block' ) );

	}

	/**
	 * Enqueue Gutenberg block script
	 */
	public function gutenberg_block() {

		wp_register_script(
			'openmaps-block',
			plugins_url( 'block/openmaps-block.js', __FILE__ ),
			array(
				'wp-blocks',
				'wp-element',
				'wp-block-editor',
				'wp-components',
			),
			WP_OPENMAPS_VERSION,
			true
		);

		$args = array(
			'post_type' => 'openmaps',
			'numberposts' => -1,
			'fields' => 'ids',
		);
		$olmaps = get_posts( $args );
		foreach ( $olmaps as $mapid ) {
			$templist[ $mapid ] = get_the_title( $mapid );
		}
		$openmaps_vars = array(
			'templates' => wp_json_encode( $templist ),
			'_select_map' => __( 'Select a map to display', 'openmaps' ),
			'_map_height' => __( 'Map Height', 'openmaps' ),
			'_units' => __( 'units', 'openmaps' ),
		);
		wp_localize_script( 'openmaps-block', 'openmapsBlockVars', $openmaps_vars );
		wp_enqueue_script( 'openmaps-block' );
	}

	/**
	 * Register widget
	 */
	public function register_widget() {
		register_widget( 'openmaps_Widget' );
	}
	/**
	 * Load text domain
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'openmaps', false, basename( dirname( dirname( __FILE__ ) ) ) . '/languages/' );
	}

	/**
	 * Load front-end scripts
	 *
	 * @return void
	 */
	public function register_scripts() {

		$min = defined( 'WP_DEBUG' ) && true === WP_DEBUG ? '' : '.min';

		wp_register_style( 'openmaps-ol', plugins_url( 'ol/ol.css', __FILE__ ), array(), '6.3.1' );
		wp_register_script( 'openmaps-ol', plugins_url( 'ol/ol.js', __FILE__ ), array(), '6.3.1', true );
		wp_register_script( 'openmaps-olms', plugins_url( 'ol/olms.js', __FILE__ ), array( 'openmaps-ol' ), '5.0.2', true );

		wp_register_style( 'openmaps-style', plugins_url( 'css/openmaps' . $min . '.css', __FILE__ ), array(), WP_OPENMAPS_VERSION );
		wp_register_script( 'openmaps-script', plugins_url( 'js/openmaps' . $min . '.js', __FILE__ ), array( 'jquery', 'openmaps-ol' ), WP_OPENMAPS_VERSION, true );
	}

	/**
	 * Load custom post scripts.
	 *
	 * @param string $hook page hook.
	 */
	public function load_admin_scripts( $hook ) {

		if ( in_array( $hook, array( 'post.php', 'post-new.php' ) ) ) {
			$screen = get_current_screen();
			$min = defined( 'WP_DEBUG' ) && true === WP_DEBUG ? '' : '.min';

			wp_enqueue_style( 'openmaps-admin', plugins_url( 'css/openmaps-admin' . $min . '.css', __FILE__ ), array(), WP_OPENMAPS_VERSION );

			if ( is_object( $screen ) && 'openmaps' == $screen->post_type ) {

				wp_enqueue_media();
				wp_enqueue_editor();

				wp_enqueue_style( 'openmaps-ol', plugins_url( 'ol/ol.css', __FILE__ ), array(), '6.3.1' );
				wp_enqueue_script( 'openmaps-ol', plugins_url( 'ol/ol.js', __FILE__ ), array(), '6.3.1', true );

				wp_enqueue_script( 'openmaps-admin', plugins_url( 'js/openmaps-admin' . $min . '.js', __FILE__ ), array( 'jquery' ), WP_OPENMAPS_VERSION );
			}
		}
	}

	/**
	 * Handle the [openmaps] shortcode
	 *
	 * @param array $atts Array of shortcode attributes.
	 * @return string Form html + application.
	 */
	public function openmaps_do_shortcode( $atts = array() ) {

		$args = shortcode_atts(
			array(
				'id' => 0,
				'height' => '',
				'widget' => 0,
			),
			$atts
		);

		$map_id = (int) esc_attr( $args['id'] );

		if ( ! $map_id ) {
			$output = '<h4>- ' . __( 'No map selected', 'openmaps' ) . ' -</h4>';
			return $output;
		}

		$widget = esc_attr( $args['widget'] );
		$height = esc_attr( $args['height'] );
		$map_height = strlen( $height ) ? $height : '500px';

		$html_map_id = $map_id;

		if ( strlen( $widget ) ) {
			$html_map_id .= '_' . $widget;
		}

		// Map Coordinates.
		$lat = get_post_meta( $map_id, 'openmaps_lat', true );
		$lat = $lat ? $lat : '40.712776';

		$lon = get_post_meta( $map_id, 'openmaps_lon', true );
		$lon = $lon ? $lon : '-74.005974';

		$stylekey = get_post_meta( $map_id, 'openmaps_style', true );

		$zoom = get_post_meta( $map_id, 'openmaps_zoom', true );
		$zoom = $zoom ? $zoom : 12;

		$zoom_scroll = get_post_meta( $map_id, 'openmaps_zoom_scroll', true );

		// General settings.
		$settings = get_option( 'openmaps_settings' );
		$styles = $settings['style'];

		$styleurl = isset( $styles[ $stylekey ]['url'] ) ? $styles[ $stylekey ]['url'] : 0;
		$styleurl = strlen( $styleurl ) ? $styleurl : 0;

		// Load front-end scripts and styles.
		wp_enqueue_style( 'openmaps-ol' );

		if ( 0 !== $styleurl ) {
			wp_enqueue_script( 'openmaps-olms' );
		}
		wp_enqueue_style( 'openmaps-style' );
		wp_enqueue_script( 'openmaps-script' );

		$map_data = array(
			'mapid' => $html_map_id,
			'lat' => $lat,
			'lon' => $lon,
			'style' => $styleurl,
			'zoom' => $zoom,
			'zoom_scroll' => $zoom_scroll,
		);

		$output = '<div class="wrap-openmaps" data-infomap=\'' . wp_json_encode( $map_data ) . '\'>';
		$output .= '<div id="openmaps_' . $html_map_id . '" class="openmap" style="height: ' . $map_height . ';"></div>';

		$output .= '<div style="display: none;" id="wrap-overlay-' . $html_map_id . '">';

		// Output markers and infoboxes.
		$marker_settings = get_post_meta( $map_id, 'openmaps_marker', true );

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

				$infobox_open = 1 === $marker['infobox_open'] ? '' : ' infobox-closed';

				if ( strlen( $infobox ) ) {
					$output .= '<div class="wpol-infopanel' . $infobox_open . '" id="infopanel_' . $html_map_id . '_' . $key . '" >';
					$output .= '<div class="wpol-infolabel">' . nl2br( $infobox ) . '</div>';
					$output .= '<div class="wpol-arrow"></div><div class="wpol-infopanel-close"><img src="' . plugins_url( '/images/close-x.svg', __FILE__ ) . '"></div></div>';
				}

				$output .= '<div class="wpol-infomarker" data-paneltarget="' . $html_map_id . '_' . $key . '" data-marker=\'' . wp_json_encode( $marker_data ) . '\' id="infomarker_' . $html_map_id . '_' . $key . '"><img src="' . $marker_data['icon'] . '" style="height: ' . $marker_size . 'px;"></div>';
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
		$links[] = '<a href="' . esc_url( get_admin_url( null, 'options-general.php?page=openmaps' ) ) . '">' . __( 'Settings', 'openmaps' ) . '</a>';
		return $links;
	}

	/**
	 * Register openmaps custom post type
	 */
	public function register_cpt() {
		// Register openmaps post type.
		$openmaps_cpt_labels = array(
			'name' => _x( 'OpenMaps', 'post type general name', 'openmaps' ),
			'singular_name' => _x( 'Map', 'post type singular name', 'openmaps' ),
			'add_new' => __( 'Add new', 'openmaps' ),
			'add_new_item' => __( 'Add new', 'openmaps' ),
			'edit_item' => __( 'Edit map', 'openmaps' ),
			'new_item' => __( 'New map', 'openmaps' ),
			'all_items' => __( 'All maps', 'openmaps' ),
			'view_item' => __( 'View map', 'openmaps' ),
			'search_items' => __( 'Search maps', 'openmaps' ),
			'not_found' => __( 'No map found.', 'openmaps' ),
			'not_found_in_trash' => __( 'No Maps found in trash.', 'openmaps' ),
			'menu_name' => __( 'OpenMaps', 'openmaps' ),
		);

		$openmaps_cpt_args = array(
			'labels' => $openmaps_cpt_labels,
			'public' => true,
			// 'rewrite' => true,
			'rewrite' => array(
				'slug' => 'openmaps',
			),
			'has_archive' => false,
			'hierarchical' => false,
			'map_meta_cap' => true,
			'menu_position' => null,
			'supports' => array( 'title' ),
			'menu_icon' => 'dashicons-location-alt',
			'show_in_rest' => false, // disable Gutenberg editor.
		);

		register_post_type( 'openmaps', $openmaps_cpt_args );
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
			'openmaps_copy_shortcode',
			__( 'Map Shortcode', 'openmaps' ),
			array( $this, 'render_openmaps_shortcode_metabox' ),
			'openmaps',
			'normal',
			'high'
		);

		add_meta_box(
			'openmaps_map_box',
			__( 'Map Options', 'openmaps' ),
			array( $this, 'render_openmaps_map_metabox' ),
			'openmaps',
			'normal', // normal, side.
			'high'
		);

		add_meta_box(
			'openmaps_marker_box',
			__( 'Markers', 'openmaps' ),
			array( $this, 'render_openmaps_marker_metabox' ),
			'openmaps',
			'normal', // normal, side.
			'default' // high, default, low.
		);

		add_meta_box(
			'openmaps_geolocation_box',
			__( 'Geolocation', 'openmaps' ),
			array( $this, 'render_openmaps_geolocation_metabox' ),
			'openmaps',
			'side', // normal, side.
			'default' // high, default, low.
		);

	}

	/**
	 * Render the metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_openmaps_geolocation_metabox( $post ) {
		?>
		<p><?php esc_html_e( 'Search an address or click on the map to adjust the marker position and get the coordinates', 'openmaps' ); ?></p>
			<fieldset>
				<div class="wpol-form-group">
					<input type="text" class="widefat openmaps-set-address" value="" placeholder="Type a place address"> 
				</div>
				<div class="wpol-form-group">
					<div class="button openmaps-get-coordinates"><span class="dashicons dashicons-search"></span> <?php esc_html_e( 'Search', 'openmaps' ); ?></div>
				</div>
			</fieldset>
			<fieldset>
				<div class="wpol-form-group">
					<span class="description"><?php esc_html_e( 'Latitude', 'openmaps' ); ?></span>
					<input type="text" class="widefat openmaps-get-lat" value="" placeholder="Latitude">
					<span class="description"><?php esc_html_e( 'Longitude', 'openmaps' ); ?></span>
					<input type="text" class="widefat openmaps-get-lon" value="" placeholder="Longitude">
				</div>
			</fieldset>

			<div id="wpol-admin-map" class="openmap"></div>
			<div style="display:none;">
				<div class="wpol-infomarker" id="infomarker_admin"><img src="<?php echo esc_url( plugins_url( '/images/marker.svg', __FILE__ ) ); ?>" style="height: 40px;"></div>
			</div>	
		<?php
	}

	/**
	 * Render shortcode field metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_openmaps_shortcode_metabox( $post ) {

		$height = get_post_meta( $post->ID, 'openmaps_height', true );
		$height = $height ? $height : '500';

		$height_um = get_post_meta( $post->ID, 'openmaps_height_um', true );
		$height_um = $height_um ? $height_um : 'px';
		$map_height = $height . $height_um;
		?>
		<fieldset>
			<input type="text" class="large-text" name="" value='[openmap id="<?php echo esc_attr( $post->ID ); ?>" height="<?php echo esc_attr( $map_height ); ?>"]' readonly>
		</fieldset>
		<p><?php esc_html_e( 'Copy the shortcode and paste it inside your Post or Page', 'openmaps' ); ?><br>
		<?php esc_html_e( 'You will also find OpenMaps among Blocks and Widgets', 'openmaps' ); ?></p>
		<?php
	}

	/**
	 * Render map metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_openmaps_map_metabox( $post ) {

		wp_nonce_field( 'openmaps_metaboxes', 'openmaps_nonce' );

		// Map coordinates.
		$lat = get_post_meta( $post->ID, 'openmaps_lat', true );
		$lat = $lat ? $lat : '40.712776';
		$lon = get_post_meta( $post->ID, 'openmaps_lon', true );
		$lon = $lon ? $lon : '-74.005974';

		// Map style.
		$stylekey = get_post_meta( $post->ID, 'openmaps_style', true );
		$settings = get_option( 'openmaps_settings' );
		$styles = $settings['style'];

		$zoom_scroll = get_post_meta( $post->ID, 'openmaps_zoom_scroll', true );

		$zoom = get_post_meta( $post->ID, 'openmaps_zoom', true );
		$zoom = $zoom ? $zoom : 12;

		$height = get_post_meta( $post->ID, 'openmaps_height', true );
		$height = $height ? $height : '500';

		$height_um = get_post_meta( $post->ID, 'openmaps_height_um', true );
		$height_um = $height_um ? $height_um : 'px';
		?>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Style', 'openmaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
				<select name="openmaps_style" class="all-options">
					<option value=""><?php esc_html_e( 'Default', 'openmaps' ); ?></option>
				<?php
				foreach ( $styles as $key => $value ) {
					if ( isset( $value['url'] ) && strlen( $value['url'] ) ) {
						?>
						<option <?php selected( $stylekey, $key ); ?> value="<?php echo esc_attr( $key ); ?>"><?php echo esc_attr( $value['name'] ); ?></option>
						<?php
					}
				}
				?>
				</select>
				</div>
			</fieldset>
		</div>
		<?php // translators: "Settings Page" is the link to plugins settings page. ?>
		<p><?php printf( __( 'Add more Map Styles inside %1$sSettings Page%2$s.', 'openmaps' ), '<a target="_blank" href="' . esc_url( get_admin_url( null, 'options-general.php?page=openmaps' ) ) . '">', '</a>' ); // XSS ok. ?></p>
		<hr>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Coordinates', 'openmaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
					<input type="text" class="all-options" name="openmaps_lat" value="<?php echo esc_attr( $lat ); ?>">
					<span class="description"><?php esc_html_e( 'Latitude', 'openmaps' ); ?></span>
					<input type="text" class="all-options" name="openmaps_lon" value="<?php echo esc_attr( $lon ); ?>">
					<span class="description"><?php esc_html_e( 'Longitude', 'openmaps' ); ?></span>
				</div>
				<p><?php esc_html_e( 'Get coordinates from the Geolocation box', 'openmaps' ); ?></p>
			</fieldset>
		</div>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Map Height', 'openmaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
					<input type="text" class="all-options" name="openmaps_height" value="<?php echo esc_attr( $height ); ?>"> 
					<select name="openmaps_height_um">
						<option <?php selected( $height_um, 'px' ); ?> value="px">px</option>
						<option <?php selected( $height_um, 'vh' ); ?> value="vh">vh</option>
					</select>
				</div>
			</fieldset>
		</div>

		<div class="wpol-form-group">
			<strong><?php esc_html_e( 'Zoom', 'openmaps' ); ?></strong>
			<fieldset>
				<div class="wpol-form-group">
					<input type="number" min="1" max="24" class="all-options" name="openmaps_zoom" value="<?php echo esc_attr( $zoom ); ?>"> 

					<label>
						<input type="checkbox" name="openmaps_zoom_scroll" value="1" <?php checked( $zoom_scroll, 1 ); ?> />
						<span class="description"><?php esc_html_e( 'Enable mouse wheel zoom', 'openmaps' ); ?></span>
					</label>
				</div>
			</fieldset>
		</div>
		<?php
	}

	/**
	 * Render markers metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_openmaps_marker_metabox( $post ) {

		// delete_post_meta( $post->ID, 'openmaps_marker' ); // debug.

		$marker_settings = get_post_meta( $post->ID, 'openmaps_marker', true );

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
						<strong><?php esc_html_e( 'Coordinates', 'openmaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<input type="text" class="all-options" name="openmaps_marker[<?php echo esc_attr( $key ); ?>][lat]" value="<?php echo esc_attr( $setting['lat'] ); ?>">
								<span class="description"><?php esc_html_e( 'Latitude', 'openmaps' ); ?></span>
								<input type="text" class="all-options" name="openmaps_marker[<?php echo esc_attr( $key ); ?>][lon]" value="<?php echo esc_attr( $setting['lon'] ); ?>">
								<span class="description"><?php esc_html_e( 'Longitude', 'openmaps' ); ?></span>
							</div>
						</fieldset>
					</div>
					<hr>
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Size', 'openmaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<select name="openmaps_marker[<?php echo esc_attr( $key ); ?>][size]" class="">
									<option <?php selected( $setting['size'], '30' ); ?> value="30"><?php esc_html_e( 'Small', 'openmaps' ); ?></option>
									<option <?php selected( $setting['size'], '40' ); ?> value="40"><?php esc_html_e( 'Medium', 'openmaps' ); ?></option>
									<option <?php selected( $setting['size'], '60' ); ?> value="60"><?php esc_html_e( 'Large', 'openmaps' ); ?></option>
									<option <?php selected( $setting['size'], '80' ); ?> value="80"><?php esc_html_e( 'Extra Large', 'openmaps' ); ?></option>
								</select>
							</div>
						</fieldset>
					</div>
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Custom Marker', 'openmaps' ); ?></strong>
						<fieldset>
							<div class="wpol-form-group">
								<div class="openmaps_custom_marker-wrap">
								<input type="url" class="all-options openmaps_custom_marker" name="openmaps_marker[<?php echo esc_attr( $key ); ?>][icon]" value="<?php echo esc_attr( $setting['icon'] ); ?>">
									<button type="button" class="wpol-btn-link openmaps_marker_remove_btn"><span class="dashicons dashicons-no-alt"></span></button>
								</div>
								<button type="button" class="button openmaps_marker_upload_btn"><?php esc_html_e( 'Upload Media', 'openmaps' ); ?></button>
							</div>
						</fieldset>
					</div>

					<hr>
					<p><strong><?php esc_html_e( 'Info Box', 'openmaps' ); ?></strong></p>
					<div class="wpol-form-group">
						<label>
							<input type="checkbox" name="openmaps_marker[<?php echo esc_attr( $key ); ?>][infobox_open]" value="1" <?php checked( $setting['infobox_open'], 1 ); ?> />
							<span class="description"><?php esc_html_e( 'Visible panel', 'openmaps' ); ?></span>
						</label>
					</div>
				</div> <!-- end clone -->

				<div class="wp-editor-container openmaps_marker_editor">
					<textarea id="openmaps_infobox_<?php echo esc_attr( $key ); ?>" name="openmaps_marker[<?php echo esc_attr( $key ); ?>][infobox]" class="wp-editor-area" rows="4">
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
		<div class="button wpol-new-marker"><?php esc_html_e( 'New marker', 'openmaps' ); ?></div>
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

		$nonce = filter_input( INPUT_POST, 'openmaps_nonce', FILTER_SANITIZE_STRING );

		// Check if our nonce is set.
		if ( ! isset( $_POST['openmaps_nonce'] ) ) {
			return $post_id;
		}

		if ( ! $nonce
			|| ! wp_verify_nonce( $nonce, 'openmaps_metaboxes' )
		) {
			return $post_id;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}

		/* OK, it's safe for us to save the data now. */

		$allowed = wp_kses_allowed_html();

		$lat = filter_input( INPUT_POST, 'openmaps_lat', FILTER_SANITIZE_STRING );
		$lat = $lat ? esc_attr( $lat ) : '40.712776';
		update_post_meta( $post_id, 'openmaps_lat', $lat );

		$lon = filter_input( INPUT_POST, 'openmaps_lon', FILTER_SANITIZE_STRING );
		$lon = $lon ? esc_attr( $lon ) : '-74.005974';

		update_post_meta( $post_id, 'openmaps_lon', $lon );

		$style = filter_input( INPUT_POST, 'openmaps_style', FILTER_SANITIZE_NUMBER_INT );
		update_post_meta( $post_id, 'openmaps_style', $style );

		$height = filter_input( INPUT_POST, 'openmaps_height', FILTER_SANITIZE_STRING );
		$height = $height ? esc_attr( $height ) : '500';
		update_post_meta( $post_id, 'openmaps_height', $height );

		$height_um = filter_input( INPUT_POST, 'openmaps_height_um', FILTER_SANITIZE_STRING );
		$height_um = $height_um ? esc_attr( $height_um ) : 'px';
		update_post_meta( $post_id, 'openmaps_height_um', $height_um );

		$openmaps_zoom_scroll = filter_input( INPUT_POST, 'openmaps_zoom_scroll', FILTER_SANITIZE_NUMBER_INT );
		update_post_meta( $post_id, 'openmaps_zoom_scroll', $openmaps_zoom_scroll );

		$openmaps_zoom = filter_input( INPUT_POST, 'openmaps_zoom', FILTER_SANITIZE_NUMBER_INT );
		update_post_meta( $post_id, 'openmaps_zoom', $openmaps_zoom );

		$postvar = isset( $_POST['openmaps_marker'] ) ? wp_unslash( $_POST['openmaps_marker'] ) : array();

		$newmarkervars = array();

		foreach ( $postvar as $key => $value ) {

			$markervars['lat'] = esc_attr( $value['lat'] );
			$markervars['lon'] = esc_attr( $value['lon'] );
			$markervars['size'] = esc_attr( $value['size'] );
			$markervars['icon'] = esc_url_raw( $value['icon'] );
			$markervars['infobox'] = wp_kses_post( $value['infobox'] );
			$markervars['infobox_open'] = (int) $value['infobox_open'];

			// $markervars = filter_var_array( $value, $markerargs, true );
			if ( strlen( $markervars['lat'] ) && strlen( $markervars['lon'] ) ) {
				$newmarkervars[ $key ] = $markervars;
			}
		}
		update_post_meta( $post_id, 'openmaps_marker', $newmarkervars );
	}

} // end class

// Call options.
Openmaps_Plugin::get_instance();
