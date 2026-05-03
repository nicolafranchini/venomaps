<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles the logic for the 'venomaps' post type edit screen.
 */
class Venomaps_Edit {

	/**
	 * A reference to the main plugin instance.
	 *
	 * @var Venomaps_Plugin
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param Venomaps_Plugin $plugin The main plugin instance.
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Initiate hooks for the admin edit screen.
	 */
	public function init_hooks() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_post_edit_scripts' ), 10, 1 );
		add_action( 'add_meta_boxes', array( $this, 'add_metaboxes' ) );
		add_action( 'save_post', array( $this, 'save_metaboxes' ), 10, 2 );
	}

	/**
	 * Load custom post scripts.
	 *
	 * @param string $hook page hook.
	 */
	public function load_post_edit_scripts( $hook ) {
		if ( in_array( $hook, array( 'post.php', 'post-new.php' ) ) ) {
			$screen = get_current_screen();
			if ( is_object( $screen ) && 'venomaps' == $screen->post_type ) {

				$min = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? '' : '.min';

				wp_enqueue_media();
				wp_enqueue_editor();

				wp_enqueue_style( 'venomaps-admin', plugin_dir_url( __DIR__ ) . 'css/venomaps-admin-bundle' . $min . '.css', array(), VENOMAPS_VERSION );
				wp_register_script( 'venomaps-admin', plugin_dir_url( __DIR__ ) . 'js/venomaps-admin-bundle' . $min . '.js', array(), VENOMAPS_VERSION, true );

				// --- RECUPERO SETTINGS GLOBALI ---
				$global_settings = get_option( 'venomaps_settings', array() );
				$plugin_defaults = $this->plugin->get_default_settings(); // I tuoi default hardcoded.

				// Prepariamo i default per i nuovi marker basandoci sulle impostazioni generali.
				$merged_defaults = array(
					'color'        => ! empty( $global_settings['default_color'] ) ? $global_settings['default_color'] : $plugin_defaults['color'],
					'size'         => ! empty( $global_settings['default_size'] ) ? $global_settings['default_size'] : $plugin_defaults['size'],
					'icon'         => ! empty( $global_settings['default_icon'] ) ? $global_settings['default_icon'] : '',
					'infobox'      => '',
					'infobox_open' => false,
					'title'        => '',
				);

				$venomaps_vars = array(
					'styles'           => wp_json_encode( $this->plugin->available_styles() ),
					'ajax_url'         => admin_url( 'admin-ajax.php' ),
					'nonce'            => wp_create_nonce( 'vmap-ajax-nonce' ),
					'default_settings' => wp_json_encode( $merged_defaults ), // <--- Ora contiene i tuoi Style settings
				);

				wp_localize_script( 'venomaps-admin', 'venomapsAdminVars', $venomaps_vars );
				wp_enqueue_script( 'venomaps-admin' );
			}
		}
	}

	/**
	 * Adds the meta boxes.
	 */
	public function add_metaboxes() {
		add_meta_box(
			'venomaps_map_box',
			__( 'Map Options', 'venomaps' ),
			array( $this, 'render_venomaps_map_metabox' ),
			'venomaps',
			'normal',
			'high'
		);

		add_meta_box(
			'venomaps_marker_box',
			__( 'Markers', 'venomaps' ),
			array( $this, 'render_venomaps_marker_metabox' ),
			'venomaps',
			'normal',
			'default'
		);

		add_meta_box(
			'venomaps_routes_box',
			__( 'Routes', 'venomaps' ),
			array( $this, 'render_venomaps_routes_metabox' ),
			'venomaps',
			'normal', // o 'side' se preferisci.
			'default'
		);

		add_meta_box(
			'venomaps_csv_box',
			sprintf(
				'%s <a href="%s" target="_blank" style="text-decoration:none; vertical-align:middle; margin-left:0.4em; margin-right:auto" title="%s"><span class="dashicons dashicons-info" style="font-size:18px;"></span></a>',
				esc_html__( 'Batch import', 'venomaps' ),
				esc_url( 'https://veno.es/venomaps/documentation/#batch-import' ),
				esc_attr__( 'View documentation', 'venomaps' )
			),
			array( $this, 'render_venomaps_csv_metabox' ),
			'venomaps',
			'normal',
			'low'
		);

		add_meta_box(
			'venomaps_geolocation_box',
			__( 'Geolocation', 'venomaps' ),
			array( $this, 'render_venomaps_geolocation_metabox' ),
			'venomaps',
			'side',
			'default'
		);
	}

	/**
	 * Render the metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_geolocation_metabox( $post ) {
		?>
		<div class="wpol-form-group">
			<?php esc_html_e( 'Drag the marker to adjust the position and get the coordinates', 'venomaps' ); ?>
		</div>
			<fieldset>
				<div class="wpol-form-group">
					<div class="vmap-input-group">
						<input type="text" class="large-text venomaps-set-address" value="" placeholder="<?php esc_html_e( 'Search address', 'venomaps' ); ?>">
						<button type="button" class="wpol-btn-link venomaps-get-coordinates"><span class="dashicons dashicons-search"></span></button>
					</div>
					<p class="venomaps-response"></p>
				</div>
			</fieldset>
			<fieldset>
				<div class="wpol-form-group">
					<span class="description"><strong><?php esc_html_e( 'Coordinates', 'venomaps' ); ?></strong> ( <?php esc_html_e( 'Latitude', 'venomaps' ); ?> / <?php esc_html_e( 'Longitude', 'venomaps' ); ?> )</span>
				</div>
				<div class="wpol-form-group vmap-flex vmap-flex-collapse-md">
					<input type="text" readonly class="large-text venomaps-get-lat" value="" placeholder="Latitude">
					<input type="text" readonly class="large-text venomaps-get-lon" value="" placeholder="Longitude">
				</div>
			</fieldset>

			<div id="wpol-admin-map" class="venomap"></div>
			<div style="display:none;">
				<div class="wpol-infomarker" id="infomarker_admin"></div>
			</div>
		<?php
	}

	/**
	 * Render routes metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_routes_metabox( $post ) {
		$routes  = get_post_meta( $post->ID, 'venomaps_routes', true );
		$markers = get_post_meta( $post->ID, 'venomaps_marker', true );
		if ( ! is_array( $routes ) ) {
			$routes = array();
		}
		?>
		<div id="vmap-routes-container">
			<?php if ( ! $markers || count( $markers ) < 2 ) : ?>
				<p><?php esc_html_e( 'Add at least two markers and update the post to create routes.', 'venomaps' ); ?></p>
			<?php else : ?>
				<div class="vmap-routes-list">
					<?php foreach ( $routes as $index => $route_data ) : ?>
						<div class="vmap-route-row" id="vmap-route-row-<?php echo esc_attr( $index ); ?>" data-index="<?php echo esc_attr( $index ); ?>">
							<strong><?php esc_html_e( 'Route', 'venomaps' ); ?> #<?php echo esc_attr( $index + 1 ); ?></strong>

							<div class="vmap-flex vmap-flex-collapse vmap-align-center">

								<input type="text" class="vmap-route-title" name="venomaps_routes[<?php echo esc_attr( $index ); ?>][title]" value="<?php echo esc_html( $route_data['title'] ?? '' ); ?>">

								<div class="vmap-route-stops-select">
									<?php foreach ( $markers as $marker_key => $marker_data ) : ?>
									<label>
										<input class="vmap-change-route" type="checkbox" value="<?php echo esc_attr( $marker_key ); ?>" name="venomaps_routes[<?php echo esc_attr( $index ); ?>][stops][]" <?php checked( ! empty( $route_data['stops'] ) && in_array( $marker_key, $route_data['stops'] ) ); ?> placeholder="<?php esc_html_e( 'Title', 'venomaps' ); ?>"> <?php echo esc_html( ! empty( $marker_data['title'] ) ? $marker_data['title'] : 'Marker #' . ( $marker_key + 1 ) ); ?>
									</label>
									<?php endforeach; ?>
								</div>

								<button type="button" class="button vmap-preview-route" style="margin-left:auto;"><?php esc_html_e( 'Preview', 'venomaps' ); ?></button>
								<div class="vmap-del-route wpol-btn-link"><span class="dashicons dashicons-trash"></span></div>
							</div>
							<input type="hidden" class="vmap-route-geometry" name="venomaps_routes[<?php echo esc_attr( $index ); ?>][geometry]" value="<?php echo esc_attr( $route_data['geometry'] ?? '' ); ?>">
							<small class="vmap-route-status"><?php echo ! empty( $route_data['geometry'] ) ? esc_html__( 'A route has been selected and saved.', 'venomaps' ) : ''; ?></small>
						</div>
					<?php endforeach; ?>
				</div>
				<button type="button" class="button" id="vmap-add-route"><?php esc_html_e( 'Add Route', 'venomaps' ); ?></button>
				
				<!-- Hidden template for new routes (CORRECTED) -->
				<div id="vmap-route-template" style="display: none;">
					<div class="vmap-route-row" id="vmap-route-row-__INDEX__" data-index="__INDEX__">
						<strong><?php esc_html_e( 'Route', 'venomaps' ); ?> #__NUM__</strong>
						<div class="vmap-flex vmap-flex-collapse vmap-align-center">

							<input type="text" class="vmap-route-title" value="" placeholder="<?php esc_html_e( 'Title', 'venomaps' ); ?>">

							<!-- Questo contenitore ora è vuoto. Lo popolerà interamente la funzione JS `updateAllRouteSelects` -->
							<div class="vmap-route-stops-select">
							</div>

							<button type="button" class="button vmap-preview-route" style="margin-left:auto;"><?php esc_html_e( 'Preview', 'venomaps' ); ?></button>
							<div class="vmap-del-route wpol-btn-link"><span class="dashicons dashicons-trash"></span></div>
						</div>
						<!-- L'input della geometria non ha l'attributo 'name', che verrà aggiunto via JS. Questo è corretto. -->
						<input type="hidden" class="vmap-route-geometry" value="">
						<small class="vmap-route-status"></small>
					</div>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Render map metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_map_metabox( $post ) {
		wp_nonce_field( 'venomaps_metaboxes', 'venomaps_nonce' );

		$default_coords = $this->plugin->get_default_coords();

		// Map coordinates.
		$lat = get_post_meta( $post->ID, 'venomaps_lat', true );
		$lat = $lat ? $lat : $default_coords['lat'];
		$lon = get_post_meta( $post->ID, 'venomaps_lon', true );
		$lon = $lon ? $lon : $default_coords['lon'];

		// Map style.
		$stylekey = get_post_meta( $post->ID, 'venomaps_style', true );
		$styles   = $this->plugin->available_styles();
		?>
	<div class="vmap-flex vmap-flex-collapse-lg">
		<div class="vmap-marker-box-left">

			<div class="wpol-form-group">
				<strong><?php esc_html_e( 'Map Shortcode', 'venomaps' ); ?></strong>
				<fieldset>
					<input type="text" class="large-text" name="" value='[venomap id="<?php echo esc_attr( $post->ID ); ?>"]' readonly>
				</fieldset>
				<p><?php esc_html_e( 'Copy the shortcode and paste it inside your Posts or Pages, or search VenoMaps among Blocks to set more options', 'venomaps' ); ?></p>
			</div>
			<hr>

			<div class="wpol-form-group">
				<strong><?php esc_html_e( 'Style', 'venomaps' ); ?></strong>
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
							foreach ( $value['maps'] as $sub_key => $sub_value ) {
								if ( isset( $sub_value['url'] ) && strlen( $sub_value['url'] ) ) {
									?>
								<option <?php selected( $stylekey, $key . '_' . $sub_key ); ?> value="<?php echo esc_attr( $key ) . '_' . esc_attr( $sub_key ); ?>"><?php echo esc_attr( $sub_value['name'] ); ?></option>
									<?php
								}
							}
							echo '</optgroup>';
						}
					}
					?>
					</select>
				</div>
			</div>
			<?php // translators: "Settings Page" is the link to plugins settings page. ?>
			<p><?php printf( esc_html__( 'Add more Map Styles inside %1$sSettings Page%2$s.', 'venomaps' ), '<a target="_blank" href="' . esc_url( get_admin_url( null, 'options-general.php?page=venomaps' ) ) . '">', '</a>' ); // XSS ok. ?></p>
			<hr>

			<div><strong><?php esc_html_e( 'Center', 'venomaps' ); ?></strong> ( <?php esc_html_e( 'Latitude', 'venomaps' ); ?> / <?php esc_html_e( 'Longitude', 'venomaps' ); ?> )</div>
			<div class="wpol-form-group">
				<div class="vmap-flex vmap-flex-collapse-md">
					<input class="all-options large-text" type="text" name="venomaps_lat" value="<?php echo esc_attr( $lat ); ?>">
					<input class="all-options large-text" type="text" name="venomaps_lon" value="<?php echo esc_attr( $lon ); ?>">
				</div>
			</div>
		</div>
		<div class="vmap-marker-box-right">
			<div id="preview-admin-map" class="venomap-mini"></div>
		</div>
	</div>
		<?php
	}

	/**
	 * Render markers metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_marker_metabox( $post ) {
		$marker_settings = get_post_meta( $post->ID, 'venomaps_marker', true ); // return array.
		$output_settings = array();
		// $default_settings = $this->plugin->get_default_settings();

		// --- FIX: Recupera i settings globali e uniscili ai default del plugin ---
		$global_settings = get_option( 'venomaps_settings', array() );
		$plugin_defaults = $this->plugin->get_default_settings();

		$merged_global_defaults = array(
			'title'        => $plugin_defaults['title'],
			'lat'          => $plugin_defaults['lat'],
			'lon'          => $plugin_defaults['lon'],
			'size'         => ! empty( $global_settings['default_size'] ) ? $global_settings['default_size'] : $plugin_defaults['size'],
			'icon'         => ! empty( $global_settings['default_icon'] ) ? $global_settings['default_icon'] : $plugin_defaults['icon'],
			'color'        => ! empty( $global_settings['default_color'] ) ? $global_settings['default_color'] : $plugin_defaults['color'],
			'infobox'      => $plugin_defaults['infobox'],
			'infobox_open' => $plugin_defaults['infobox_open'],
		);

		if ( $marker_settings ) {
			foreach ( $marker_settings as $index => $setting ) {
				$full_settings = array();
				foreach ( $merged_global_defaults as $key => $default_val ) {
					$full_settings[ $key ] = isset( $setting[ $key ] ) ? $setting[ $key ] : $default_val;
				}
				$output_settings[] = $full_settings;
			}
		}

		if ( empty( $output_settings ) ) {
			$output_settings = array( $merged_global_defaults );
		}
		?>

<div class="vmap-wrap-rows">
		<?php
		foreach ( $output_settings as $index => $setting ) {
			$key = $index + 1;
			$setting['key'] = $key;
			?>
	<div class="vmap-marker-row" id="vmap-row-<?php echo esc_attr( $index ); ?>" data-marker-key="<?php echo esc_attr( $index ); ?>">
		<div class="vmap-flex vmap-flex-collapse vmap-align-center vmap-row-data">
			<div>
				<div class="vmap-edit-marker">
				<span class="vmap-badge"><span class="dashicons dashicons-edit"></span> <span class="vmap-badge-text"><?php echo esc_attr( $key ); ?></span></span></div></div>
			<div style="margin-right: 1em;">
				<input class="vmap-modal-set-title large-text" data-update="title" type="text" value="<?php echo esc_attr( $setting['title'] ); ?>" placeholder="<?php esc_html_e( 'Title', 'venomaps' ); ?>">
			</div>

			<div style="margin-left:auto; margin-right: 0;">
				<input class="vmap-modal-set-lat vmap-input large-text" data-update="lat" type="text" value="<?php echo esc_attr( $setting['lat'] ); ?>" placeholder="<?php esc_html_e( 'Latitude', 'venomaps' ); ?>">
			</div>
			<div style="margin-left:1em; margin-right: 0;">
				<input class="vmap-modal-set-lon vmap-input large-text" data-update="lon" type="text" value="<?php echo esc_attr( $setting['lon'] ); ?>" placeholder="<?php esc_html_e( 'Longitude', 'venomaps' ); ?>">
			</div>
			<div class="vmap-del-row">
				<div class="wpol-btn-link"><span class="dashicons dashicons-trash"></span></div>
			</div>
		</div>
		<textarea class="vmap-modal-set-data vmap-hidden" name="venomaps_data[<?php echo esc_attr( $index ); ?>]" ><?php echo wp_json_encode( $setting ); ?></textarea>
	</div>
			<?php
		}
		?>
</div>
		<?php
		// Recupera le impostazioni globali.
		$venomaps_options = get_option( 'venomaps_settings' );
		$global_default_color = ! empty( $global_settings['default_color'] ) ? $global_settings['default_color'] : '#000000';
		?>
<!-- vmap-modal -->
<div id="vmap-modal" class="vmap-modal">
	<div class="vmap-modal-helper vmap-modal-dismiss"></div>
	<div class="vmap-modal-dialog">
		<div class="vmap-modal-content">
			<div class="vmap-flex vmap-flex-collapse vmap-modal-header">
				<div>
					<h3 class="vmap-modal-title"></h3>
				</div>
				<div class="vmap-modal-dismiss vmap-left-auto vmap-cursor-pointer">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/></svg>
				</div>
			</div>
			<div class="vmap-flex vmap-flex-collapse-md">
				<div class="vmap-marker-box-left">
					<div class="wpol-form-group vmap-icon-uploader">

						<div class="vmap-flex-grow-1" style="padding-left: 0.5em;">
							<div class="wpol-form-group">
								<strong><?php esc_html_e( 'Size', 'venomaps' ); ?></strong>
							</div>
							<input type="range" name="" class="vmap-modal-get-size vmap-icon-set-size vmap-form-range" min="30" max="100">
						</div>

						<div class="vmap-color-component">
							<div class="wpol-form-group">
								<strong><?php esc_html_e( 'Color', 'venomaps' ); ?></strong>
							</div>
							<div class="vmap-flex vmap-flex-collapse">
								<input type="color" value="" class="vmap-modal-get-color vmap-input vmap-form-control-color" data-default-color="<?php echo esc_attr( $global_default_color ); ?>" />
								<input type="text" value="" class="vmap-modal-set-color vmap-input" placeholder="<?php echo esc_attr( $global_default_color ); ?>" />
							</div>
						</div>

						<div class="wpol-form-group vmap-flex vmap-align-center">
							<div class="vmap-icon-preview">
								<!-- DIV SVG -->
								<div class="vmap-icon-default venomaps_marker_upload_btn">
									<!-- Verrà riempito dal JS con venomapsAdminVars.global_svg -->
								</div>

								<div class="vmap-icon-image venomaps_marker_upload_btn vmap-hidden">
									<!-- Verrà riempito dal JS con il tag <img> -->
								</div>
							</div>
							<div style="margin-left: 15px;">
								<div class="wpol-btn-link venomaps_marker_upload_btn"><span class="dashicons dashicons-update"></span></div>
								<div class="wpol-btn-link venomaps_marker_remove_btn vmap-invisible"><span class="dashicons dashicons-trash"></span></div>
								<!-- Input nascosto per l'URL icona -->
								<input type="hidden" class="vmap-modal-get-icon" value="">
							</div>
						</div>
					</div>
					<!-- vmap icon uploader -->
				</div>

				<div class="vmap-marker-box-right">
					<div class="wpol-form-group">
						<strong><?php esc_html_e( 'Info Box', 'venomaps' ); ?></strong>
					</div>
					<div class="wpol-form-group">
						<textarea class="vmap-modal-get-infobox vmap-form-control"></textarea>
					</div>
					<div class="wpol-form-group">
						<label>
							<input class="vmap-modal-get-infobox-open vmap-input" type="checkbox" value="1" />
							<span class="description"><?php esc_html_e( 'Default Open', 'venomaps' ); ?></span>
						</label>
					</div>
				</div>
				<!-- vmap box right -->
			</div>

		</div>
	</div>
</div>

<div class="button wpol-new-marker"><span class="dashicons dashicons-plus"></span> <?php esc_html_e( 'New marker', 'venomaps' ); ?></div>

		<?php
	}

	/**
	 * Render markers metabox
	 *
	 * @param WP_Post $post Post object.
	 */
	public function render_venomaps_csv_metabox( $post ) {
		?>
<p><?php esc_html_e( 'It is possible to batch import markers using a .csv file, the csv file should start with this line', 'venomaps' ); ?>:<br>

<code>title,lat,lon,size,icon,color,infobox,infobox_open</code>

<p><?php esc_html_e( 'Also semicolon separator allowed', 'venomaps' ); ?>:<br>

<code>title;lat;lon;size;icon;color;infobox;infobox_open</code></p>

<p>Required fields: <code>lat,lon</code></p>

<div class="vmap-uploader">
<div class="vmap-flex vmap-flex-collapse vmap-align-center">
	<button class="button vmap-set-uploader"><?php esc_html_e( 'Import CSV', 'venomaps' ); ?></button>
	<input type="hidden" class="button vmap-get-uploader" readonly data-post-id="<?php echo esc_attr( $post->ID ); ?>">
	<span class="spinner"></span>
	<div class="vmap-import-csv vmap-hidden">
		<div type="button" class="button button-primary button-large"><?php esc_html_e( 'Import data', 'venomaps' ); ?></div>
	</div>
	<span class="vmap-response-message"></span>
</div>
<p><?php esc_html_e( 'Select the CSV delimiter', 'venomaps' ); ?></p>

<div class="wpol-form-group vmap-csv-delimiter">
<label for="csv_delimiter_1">
	<input name="csv_delimiter" class="" type="radio" id="csv_delimiter_1" value="," checked>
		<?php esc_html_e( 'Comma', 'venomaps' ); ?> ( , )
</label>
<label for="csv_delimiter_2">
	<input name="csv_delimiter" type="radio" id="csv_delimiter_2" value=";">
		<?php esc_html_e( 'Semicolon', 'venomaps' ); ?> ( ; )
</label>
</div>
</div>
<p><strong><?php esc_html_e( 'Warning: selecting a new .CSV file, any previous marker of this map will be overwritten', 'venomaps' ); ?></strong></p>
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
		// Controllo sicurezza.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}
		if ( ! isset( $_POST['venomaps_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['venomaps_nonce'] ) ), 'venomaps_metaboxes' ) ) {
			return $post_id;
		}

		// Salvataggio campi base.
		$default_coords = $this->plugin->get_default_coords();
		// Recupero e unslash/sanitize.
		$lat_input   = isset( $_POST['venomaps_lat'] ) ? sanitize_text_field( wp_unslash( $_POST['venomaps_lat'] ) ) : '';
		$lon_input   = isset( $_POST['venomaps_lon'] ) ? sanitize_text_field( wp_unslash( $_POST['venomaps_lon'] ) ) : '';
		$style_input = isset( $_POST['venomaps_style'] ) ? sanitize_text_field( wp_unslash( $_POST['venomaps_style'] ) ) : '';

		// Sostituzione short ternaries (?:) con ternari completi per maggiore chiarezza e standard VIP.
		$lat = ( '' !== $lat_input ) ? $lat_input : $default_coords['lat'];
		$lon = ( '' !== $lon_input ) ? $lon_input : $default_coords['lon'];

		update_post_meta( $post_id, 'venomaps_lat', $lat );
		update_post_meta( $post_id, 'venomaps_lon', $lon );
		update_post_meta( $post_id, 'venomaps_style', $style_input );

		// Recuperiamo schema e default dal plugin.
		$schema   = $this->plugin->get_field_schema();
		$postdata = isset( $_POST['venomaps_data'] ) ? (array) wp_unslash( $_POST['venomaps_data'] ) : array();

		$newmarkervars = array();

		foreach ( $postdata as $key => $json_value ) {
			$value = json_decode( $json_value, true );
			if ( ! is_array( $value ) ) {
				continue;
			}
			$marker = array();
			foreach ( $schema as $field => $config ) {
				$raw_val = isset( $value[ $field ] ) ? $value[ $field ] : $config['default'];
				$func    = $config['sanitize'];

				// Sanitizzazione dinamica.
				$marker[ $field ] = function_exists( $func ) ? $func( $raw_val ) : sanitize_text_field( $raw_val );
			}

			// Validazione minima: lat e lon obbligatori.
			if ( ! empty( $marker['lat'] ) && ! empty( $marker['lon'] ) ) {
				// $newmarkervars[ $key ] = $marker;
				$newmarkervars[] = $marker; // Usiamo [] per resettare gli indici (0, 1, 2...).
			}
		}

		// 3. SALVATAGGIO REALE:
		// Sovrascriviamo SEMPRE. Se $newmarkervars è vuoto, pulirà il database.
		// Questo permette l'eliminazione effettiva.
		update_post_meta( $post_id, 'venomaps_marker', $newmarkervars );

		// Save routes data.
		if ( isset( $_POST['venomaps_routes'] ) ) {
			$routes_data = (array) wp_unslash( $_POST['venomaps_routes'] );
			$sanitized_routes = array();

			foreach ( $routes_data as $route ) {
				if ( ! empty( $route['stops'] ) && is_array( $route['stops'] ) && count( $route['stops'] ) >= 2 && ! empty( $route['geometry'] ) ) {
					$sanitized_routes[] = array(
						'stops'    => array_map( 'absint', $route['stops'] ),
						'geometry' => sanitize_textarea_field( $route['geometry'] ),
						'title'    => sanitize_text_field( $route['title'] ?? '' ),
					);
				}
			}
			update_post_meta( $post_id, 'venomaps_routes', $sanitized_routes );
		} else {
			delete_post_meta( $post_id, 'venomaps_routes' );
		}
	}
}
