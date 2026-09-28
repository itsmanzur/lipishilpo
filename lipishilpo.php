<?php
/**
 * Plugin Name: Lipishilpo — Bengali & Multilingual Manuscript Studio
 * Plugin URI:  https://lipishilpo.com
 * Description: Multilingual writing and editorial studio. Rule-based proofreading, chapter management, and manuscript tools.
 * Version:     1.0.0
 * Author:      Lipishilpo Team
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: lipishilpo
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LIPISHILPO_VERSION', '1.0.0' );
define( 'LIPISHILPO_FILE', __FILE__ );
define( 'LIPISHILPO_DIR', plugin_dir_path( __FILE__ ) );
define( 'LIPISHILPO_URL', plugin_dir_url( __FILE__ ) );
define( 'LIPISHILPO_REST_NAMESPACE', 'lipishilpo/v1' );

// ── Include Free Classes ──────────────────────────────────────────────────
require_once LIPISHILPO_DIR . 'includes/class-admin.php';
require_once LIPISHILPO_DIR . 'includes/class-projects.php';

// ── Plugin Init ───────────────────────────────────────────────────────────
add_action( 'plugins_loaded', 'lipishilpo_init', 10 );

function lipishilpo_init() {
	Lipishilpo_Admin::init();
	Lipishilpo_Projects::init();

	// Hook for Pro addon or external extensions
	do_action( 'lipishilpo_loaded' );
}

// ── Shortcode: [lipishilpo] ────────────────────────────────────────────────
add_shortcode( 'lipishilpo', 'lipishilpo_shortcode' );

function lipishilpo_shortcode( $atts ) {
	$atts = shortcode_atts( array(), $atts, 'lipishilpo' );

	if ( ! is_user_logged_in() ) {
		return '<p class="lipishilpo-login-notice">' .
			wp_kses_post( sprintf(
				/* translators: %s: login URL */
				__( 'Please <a href="%s">sign in</a> to access Lipishilpo.', 'lipishilpo' ),
				esc_url( wp_login_url( get_permalink() ) )
			) ) .
			'</p>';
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		return '<p class="lipishilpo-login-notice">' .
			esc_html__( 'You need permission to create or edit posts to use Lipishilpo.', 'lipishilpo' ) .
			'</p>';
	}

	lipishilpo_enqueue_assets();

	$is_pro    = lipishilpo_is_pro() ? '1' : '0';
	$fonts_url = apply_filters( 'lipishilpo_fonts_url', LIPISHILPO_URL . 'assets/fonts' );

	return '<div id="lipishilpo-root" 
		data-rest-url="' . esc_attr( get_rest_url( null, LIPISHILPO_REST_NAMESPACE ) ) . '"
		data-admin-url="' . esc_attr( admin_url() ) . '"
		data-nonce="' . esc_attr( wp_create_nonce( 'wp_rest' ) ) . '"
		data-user-id="' . esc_attr( get_current_user_id() ) . '"
		data-pro="' . esc_attr( $is_pro ) . '"
		data-version="' . esc_attr( LIPISHILPO_VERSION ) . '"
		data-fonts-url="' . esc_attr( $fonts_url ) . '"
		data-dicts-url="' . esc_attr( LIPISHILPO_URL . 'assets/dicts' ) . '"
	></div>';
}

// ── Enqueue Assets ────────────────────────────────────────────────────────
function lipishilpo_enqueue_assets() {
	$asset_file = LIPISHILPO_DIR . 'assets/js/lipishilpo-editor.asset.php';

	if ( file_exists( $asset_file ) ) {
		$asset = require $asset_file;
	} else {
		$asset = array(
			'dependencies' => array(),
			'version'      => LIPISHILPO_VERSION,
		);
	}

	$font_css = LIPISHILPO_DIR . 'assets/css/lipishilpo-fonts.css';
	if ( file_exists( $font_css ) ) {
		wp_enqueue_style(
			'lipishilpo-fonts',
			LIPISHILPO_URL . 'assets/css/lipishilpo-fonts.css',
			array(),
			$asset['version']
		);
	}

	wp_enqueue_style(
		'lipishilpo-editor',
		LIPISHILPO_URL . 'assets/css/lipishilpo-editor.css',
		file_exists( $font_css ) ? array( 'lipishilpo-fonts' ) : array(),
		$asset['version']
	);

	wp_enqueue_script(
		'lipishilpo-editor',
		LIPISHILPO_URL . 'assets/js/lipishilpo-editor.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	// Let Pro addon enqueue any Pro extensions
	do_action( 'lipishilpo_enqueue_assets' );
}

// ── ES Module Support (Vite build) ─────────────────────────────────────────
add_filter( 'script_loader_tag', 'lipishilpo_script_type_module', 10, 3 );
function lipishilpo_script_type_module( $tag, $handle, $src ) {
	if ( 'lipishilpo-editor' === $handle || false !== strpos( $handle, 'lipishilpo-pro' ) ) {
		if ( false === strpos( $tag, 'type="module"' ) ) {
			$tag = str_replace( '<script ', '<script type="module" ', $tag );
		}
	}
	return $tag;
}

// ── Admin Menu ────────────────────────────────────────────────────────────
add_action( 'admin_menu', 'lipishilpo_admin_page_menu' );

function lipishilpo_admin_page_menu() {
	add_menu_page(
		__( 'Lipishilpo', 'lipishilpo' ),
		__( 'Lipishilpo', 'lipishilpo' ),
		'edit_posts',
		'lipishilpo',
		'lipishilpo_admin_editor_page',
		'dashicons-edit-page',
		30
	);

	add_submenu_page(
		'lipishilpo',
		__( 'Studio Editor', 'lipishilpo' ),
		__( 'Studio Editor', 'lipishilpo' ),
		'edit_posts',
		'lipishilpo',
		'lipishilpo_admin_editor_page'
	);

	add_submenu_page(
		'lipishilpo',
		__( 'User Guide & Docs', 'lipishilpo' ),
		__( 'User Guide & Docs', 'lipishilpo' ),
		'edit_posts',
		'lipishilpo-docs',
		'lipishilpo_admin_editor_page'
	);

	add_submenu_page(
		'lipishilpo',
		__( 'Settings & Info', 'lipishilpo' ),
		__( 'Settings & Info', 'lipishilpo' ),
		'manage_options',
		'lipishilpo-settings',
		array( 'Lipishilpo_Admin', 'render_settings_page' )
	);
}

function lipishilpo_admin_editor_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'Permission denied.', 'lipishilpo' ) );
	}
	lipishilpo_enqueue_assets();
	echo '<div class="wrap lipishilpo-admin-editor-wrap">';
	echo lipishilpo_shortcode( array() ); // phpcs:ignore
	echo '</div>';
}

// ── Activation / Deactivation ─────────────────────────────────────────────
register_activation_hook( LIPISHILPO_FILE, 'lipishilpo_activate' );
function lipishilpo_activate() {
	Lipishilpo_Projects::create_tables();
	flush_rewrite_rules();
}

register_deactivation_hook( LIPISHILPO_FILE, 'lipishilpo_deactivate' );
function lipishilpo_deactivate() {
	flush_rewrite_rules();
}

// ── Pro State Check (Hook-based — Free contains zero dormant Pro code) ────
function lipishilpo_is_pro() {
	/**
	 * Filters whether Lipishilpo Pro addon is active.
	 *
	 * Default: false in Free plugin.
	 * Overridden by Lipishilpo Pro addon plugin.
	 *
	 * @param bool $is_pro Whether Pro is active.
	 */
	return (bool) apply_filters( 'lipishilpo_is_pro', false );
}
