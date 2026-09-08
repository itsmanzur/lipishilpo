<?php
/**
 * LipiShilpo Uninstall Handler
 *
 * Removes all custom posts, post metadata, options, and user metadata created by Lipishilpo.
 *
 * @package Lipishilpo
 * @since   1.0.0
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// 1. Delete all manuscript projects in memory-safe batches
$post_ids = get_posts(
	array(
		'post_type'      => 'lipishilpo_project',
		'posts_per_page' => 100,
		'fields'         => 'ids',
		'post_status'    => 'any',
		'no_found_rows'  => true,
	)
);

while ( ! empty( $post_ids ) ) {
	foreach ( $post_ids as $post_id ) {
		wp_delete_post( (int) $post_id, true );
	}

	$post_ids = get_posts(
		array(
			'post_type'      => 'lipishilpo_project',
			'posts_per_page' => 100,
			'fields'         => 'ids',
			'post_status'    => 'any',
			'no_found_rows'  => true,
		)
	);
}

// 2. Delete plugin user metadata
delete_metadata( 'user', 0, '_lipishilpo_personal_dict', '', true );
delete_metadata( 'user', 0, '_lipishilpo_daily_target', '', true );
delete_metadata( 'user', 0, '_lipishilpo_streak_count', '', true );
delete_metadata( 'user', 0, '_lipishilpo_last_streak_date', '', true );

// 3. Delete plugin options
delete_option( 'lipishilpo_version' );
delete_option( 'lipishilpo_daily_target' );
delete_option( 'lipishilpo_openai_key' );
delete_option( 'lipishilpo_openai_model' );
delete_option( 'lipishilpo_license_key' );
delete_option( 'lipishilpo_license_status' );

