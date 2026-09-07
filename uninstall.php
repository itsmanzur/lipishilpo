<?php
/**
 * LipiShilpo Uninstall
 *
 * Removes all custom posts, options, and user metadata created by the plugin.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete all manuscript projects
$posts = get_posts( array(
	'post_type'      => 'lipishilpo_project',
	'posts_per_page' => -1,
	'post_status'    => 'any',
) );

if ( ! empty( $posts ) && is_array( $posts ) ) {
	foreach ( $posts as $post ) {
		wp_delete_post( $post->ID, true );
	}
}

// Delete plugin user metadata
delete_metadata( 'user', 0, '_lipishilpo_personal_dict', '', true );
delete_metadata( 'user', 0, '_lipishilpo_daily_target', '', true );
delete_metadata( 'user', 0, '_lipishilpo_streak_count', '', true );
delete_metadata( 'user', 0, '_lipishilpo_last_streak_date', '', true );

// Delete plugin options
delete_option( 'lipishilpo_openai_key' );
delete_option( 'lipishilpo_openai_model' );
delete_option( 'lipishilpo_license_key' );
delete_option( 'lipishilpo_license_status' );
