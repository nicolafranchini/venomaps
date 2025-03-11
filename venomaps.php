<?php
/**
 * VenoMaps
 *
 * @package venomaps
 *
 * Plugin Name: VenoMaps
 * Plugin URI: https://veno.es/venomaps
 * Description: Create maps with custom styles, multiple markers, clusters, info windows with rich text editors. Widget and Block available.
 * Version: 1.2.6
 * Author: Nicola Franchini
 * Author URI: https://veno.es
 * Text Domain: venomaps
 * Domain Path: /languages
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
define( 'VENOMAPS_VERSION', '1.2.6' );

if ( ! class_exists( 'Venomaps_Plugin', false ) ) {
	require_once dirname( __FILE__ ) . '/include/class-venomaps-plugin.php';
}
