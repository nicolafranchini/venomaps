<?php
/**
 * VenoMaps
 *
 * @package venomaps
 *
 * Plugin Name: VenoMaps
 * Plugin URI: https://veno.es/venomaps
 * Description: Create maps with custom styles, multiple markers, clusters, info windows with rich text editors. Widget and Block available.
 * Version: 2.0.0
 * Author: Nicola Franchini
 * Author URI: https://veno.es
 * Text Domain: venomaps
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
define( 'VENOMAPS_VERSION', '2.0.0' );

if ( ! class_exists( 'Venomaps_Plugin', false ) ) {
	require_once __DIR__ . '/include/class-venomaps-plugin.php';
}
