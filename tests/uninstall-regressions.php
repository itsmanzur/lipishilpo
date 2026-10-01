<?php
/** Isolated uninstall simulation: never loads WordPress or touches a real database. */
define( 'WP_UNINSTALL_PLUGIN', 'test' );
$scenario = $argv[1] ?? 'mixed';
$site_count = 603;
$current_site = 1;
$visited = array();
$cleaned = array();
$user_deletes = array();
$post_deletes = array();
function is_multisite() { return ! in_array( $GLOBALS['scenario'], array( 'single-keep', 'single-delete' ), true ); }
function get_sites( $args ) {
	return array_slice( range( 1, $GLOBALS['site_count'] ), $args['offset'], $args['number'] );
}
function switch_to_blog( $id ) { $GLOBALS['current_site'] = $id; $GLOBALS['visited'][] = $id; }
function restore_current_blog() { $GLOBALS['current_site'] = 1; }
function get_option( $key ) {
	if ( $GLOBALS['scenario'] === 'single-keep' || ( $GLOBALS['scenario'] === 'mixed' && $GLOBALS['current_site'] === 602 ) ) { return '0'; }
	return '1';
}
function get_posts( $args ) { return isset( $GLOBALS['post_deletes'][ $GLOBALS['current_site'] ] ) ? array() : array( $GLOBALS['current_site'] ); }
function wp_delete_post( $id, $force ) { $GLOBALS['post_deletes'][ $id ] = true; return true; }
function delete_option( $key ) { $GLOBALS['cleaned'][ $GLOBALS['current_site'] ] = true; }
function delete_metadata( $type, $id, $key, $value, $all ) { $GLOBALS['user_deletes'][] = $key; }
require dirname( __DIR__ ) . '/uninstall.php';
function check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
if ( is_multisite() ) {
	check( count( $visited ) === 603 && count( array_unique( $visited ) ) === 603, 'Sites beyond 500 were skipped or visited twice' );
	check( isset( $cleaned[603] ), 'Last site was not cleaned' );
	check( $current_site === 1, 'Blog context was not restored' );
	if ( $scenario === 'mixed' ) {
		check( ! isset( $cleaned[602] ) && ! isset( $post_deletes[602] ), 'Opt-out site was cleaned' );
		check( count( $user_deletes ) === 0, 'Shared preferences were deleted despite opt-out site' );
	} else {
		check( count( $user_deletes ) === 4, 'Shared preferences were not cleaned once after unanimous opt-in' );
	}
} else {
	check( count( $user_deletes ) === ( $scenario === 'single-delete' ? 4 : 0 ), 'Single-site preference retention incorrect' );
	check( count( $cleaned ) === ( $scenario === 'single-delete' ? 1 : 0 ), 'Single-site cleanup incorrect' );
}
echo 'PASS: uninstall ' . $scenario . "\n";
