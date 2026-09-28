<?php
/**
 * LipiShilpo Uninstall Handler
 *
 * Removes all custom posts, post metadata, options, and user metadata created by Lipishilpo
 * ONLY IF the user has explicitly opted in via the setting 'lipishilpo_delete_data_on_uninstall'.
 *
 * @package Lipishilpo
 * @since   1.0.0
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Executes plugin data cleanup for a single blog/site.
 */
function lipishilpo_uninstall_single_site() {
	// Only delete data if administrator explicitly opted in
	if ( get_option( 'lipishilpo_delete_data_on_uninstall' ) !== '1' ) {
		return;
	}

	// 1. Delete all manuscript projects in memory-safe batches
	$lipishilpo_post_ids = get_posts(
		array(
			'post_type'      => 'lipishilpo_project',
			'posts_per_page' => 100,
			'fields'         => 'ids',
			'post_status'    => 'any',
			'no_found_rows'  => true,
		)
	);

	while ( ! empty( $lipishilpo_post_ids ) ) {
		foreach ( $lipishilpo_post_ids as $lipishilpo_id ) {
			wp_delete_post( (int) $lipishilpo_id, true );
		}

		$lipishilpo_post_ids = get_posts(
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
	delete_option( 'lipishilpo_delete_data_on_uninstall' );
	delete_option( 'lipishilpo_openai_key' );
	delete_option( 'lipishilpo_openai_model' );
	delete_option( 'lipishilpo_license_key' );
	delete_option( 'lipishilpo_license_status' );
	delete_option( 'lipishilpo_ai_provider' );
	delete_option( 'lipishilpo_ai_key' );
	delete_option( 'lipishilpo_ai_model' );
	delete_option( 'lipishilpo_ai_custom_model' );
	delete_option( 'lipishilpo_ai_base_url' );
}

// Multisite vs Single-Site Execution
if ( is_multisite() ) {
	$lipishilpo_sites = get_sites( array( 'number' => 500 ) );
	if ( ! empty( $lipishilpo_sites ) ) {
		foreach ( $lipishilpo_sites as $lipishilpo_site ) {
			switch_to_blog( (int) $lipishilpo_site->blog_id );
			lipishilpo_uninstall_single_site();
			restore_current_blog();
		}
	}
} else {
	lipishilpo_uninstall_single_site();
}
