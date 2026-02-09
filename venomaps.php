<?php
/**
 * VenoMaps
 *
 * @package venomaps
 *
 * Plugin Name: VenoMaps
 * Plugin URI: https://veno.es/venomaps
 * Description: The fast, privacy-friendly Google Maps alternative. Create custom Geo Maps and markers using OpenStreetMap and OpenLayers, requiring no API keys for default styles.
 * Version: 2.0.9
 * Author: Nicola Franchini
 * Author URI: https://veno.es
 * Text Domain: venomaps
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
define( 'VENOMAPS_VERSION', '2.0.9' );

if ( ! class_exists( 'Venomaps_Plugin', false ) ) {
	require_once __DIR__ . '/include/class-venomaps-plugin.php';
}
