<?php
/**
 * Widget class
 */
class Openmaps_Widget extends WP_Widget {

	/**
	 * Initializes the widget
	 */
	public function __construct() {
		parent::__construct(
			'openmaps_widget', // Base ID.
			__( 'OpenMaps', 'wpb_widget_domain' ), // Name.
			array( 'description' => __( 'Displays one of your custom OpenMaps', 'openmaps' ) ) // Args.
		);
	}

	/**
	 * Output content
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {

		$title = apply_filters( 'widget_title', empty( $instance['title'] ) ? '' : $instance['title'], $instance );

		$data_escaped = $args['before_widget'];
		if ( isset( $title ) && strlen( $title ) > 0 ) {
			$data_escaped .= $args['before_title'] . $title . $args['after_title'];
		}

		$page_id = isset( $instance['page_id'] ) ? ' widget="widget-' . esc_attr( $args['id'] ) . '" id="' . esc_attr( $instance['page_id'] ) . '"' : 0;

		$height = isset( $instance['height'] ) ? esc_attr( $instance['height'] ) : '300';
		$height_um = isset( $instance['height_um'] ) ? esc_attr( $instance['height_um'] ) : 'px';

		$map_height = ' height="' . $height . $height_um . '"';

		$data_escaped .= do_shortcode( '[openmap' . $page_id . $map_height . ']' );

		$data_escaped .= $args['after_widget'];
		echo $data_escaped; // XSS ok.
	}

	/**
	 * Ouput options inside form
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		// Avalilable maps.
		$title = isset( $instance['title'] ) ? $instance['title'] : '';
		$page_id = isset( $instance['page_id'] ) ? $instance['page_id'] : '';
		$args = array(
			'post_type' => 'openmaps',
			'numberposts' => -1,
			'fields' => 'ids',
		);
		$olmaps = get_posts( $args );

		// Map height.
		$height = isset( $instance['height'] ) ? $instance['height'] : '300';
		$height_um = isset( $instance['height_um'] ) ? $instance['height_um'] : 'px';
		$map_height = $height . $height_um;
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php echo esc_html__( 'Title', 'openmaps' ); ?>:
			</label> 
			<input class="widefat" 
			id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" 
			name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" 
			type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>
		<p>
			<label><?php esc_html_e( 'Select a map to display', 'openmaps' ); ?></label>
			<select id="<?php echo esc_attr( $this->get_field_name( 'page_id' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'page_id' ) ); ?>" class="widefat">
			<?php
			foreach ( $olmaps as $mapid ) {
				$maptitle = get_the_title( $mapid );
				echo '<option ' . selected( $page_id, $mapid ) . ' value="' . esc_attr( $mapid ) . '">' . esc_attr( $maptitle ) . '</option>';
			}
			?>
			</select>
		</p>
		<p>
			<label><?php esc_html_e( 'Map Height', 'openmaps' ); ?></label><br>
			<input type="text" name="<?php echo esc_attr( $this->get_field_name( 'height' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'height' ) ); ?>" value="<?php echo esc_attr( $height ); ?>" style="vertical-align: middle;"> 
			<select id="<?php echo esc_attr( $this->get_field_name( 'height_um' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'height_um' ) ); ?>">
				<option <?php selected( $height_um, 'px' ); ?> value="px">px</option>
				<option <?php selected( $height_um, 'vh' ); ?> value="vh">vh</option>
			</select>
		</p>
		<?php
	}

	/**
	 * Save options
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $old_instance Previously saved values from database.
	 *
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['page_id'] = ! empty( $new_instance['page_id'] ) ? strip_tags( $new_instance['page_id'] ) : '';

		$instance['height'] = ! empty( $new_instance['height'] ) ? strip_tags( $new_instance['height'] ) : '';
		$instance['height_um'] = ! empty( $new_instance['height_um'] ) ? strip_tags( $new_instance['height_um'] ) : '';

		return $instance;
	}
}
