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

		$page_id = isset( $instance['page_id'] ) ? ' widget="widget-' . esc_attr( $args['id'] ) . '" id="' . esc_attr( $instance['page_id'] ) . '"' : '';

		if ( strlen( $page_id ) ) {
			$data_escaped .= do_shortcode( '[openmap' . $page_id . ']' );
		} else {
			$data_escaped .= esc_html_e( 'Please select a map from the widget editor', 'openmaps' );
		}
		$data_escaped .= $args['after_widget'];
		echo $data_escaped; // XSS ok.
	}

	/**
	 * Ouput options inside form
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		$title = isset( $instance['title'] ) ? $instance['title'] : '';
		$page_id = isset( $instance['page_id'] ) ? $instance['page_id'] : '';
		$args = array(
			'post_type' => 'openmaps',
			'numberposts' => -1,
			'fields' => 'ids',
		);
		$olmaps = get_posts( $args );
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
		<select id="<?php echo esc_attr( $this->get_field_name( 'page_id' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'page_id' ) ); ?>" class="widefat">
		<?php
		foreach ( $olmaps as $mapid ) {
			$maptitle = get_the_title( $mapid );
			echo '<option ' . selected( $page_id, $mapid ) . ' value="' . esc_attr( $mapid ) . '">' . esc_attr( $maptitle ) . '</option>';
		}
		?>
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

		return $instance;
	}
}
