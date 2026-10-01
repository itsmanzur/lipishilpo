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

	// User preferences are shared across sites and are handled after checking every site.
	// Delete site-local plugin options.
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

function lipishilpo_uninstall_shared_preferences() {
	delete_metadata( 'user', 0, '_lipishilpo_personal_dict', '', true );
	delete_metadata( 'user', 0, '_lipishilpo_daily_target', '', true );
	delete_metadata( 'user', 0, '_lipishilpo_streak_count', '', true );
	delete_metadata( 'user', 0, '_lipishilpo_last_streak_date', '', true );
}

// Preserve shared preferences if any site retains its plugin data.
if ( is_multisite() ) {
	$lipishilpo_delete_shared = true;
	$lipishilpo_offset = 0;
	do {
		$lipishilpo_sites = get_sites( array( 'number' => 100, 'offset' => $lipishilpo_offset, 'fields' => 'ids', 'orderby' => 'id', 'order' => 'ASC' ) );
		foreach ( $lipishilpo_sites as $lipishilpo_site_id ) {
			switch_to_blog( (int) $lipishilpo_site_id );
			try {
				if ( get_option( 'lipishilpo_delete_data_on_uninstall' ) !== '1' ) {
					$lipishilpo_delete_shared = false;
				}
				lipishilpo_uninstall_single_site();
			} finally {
				restore_current_blog();
			}
		}
		$lipishilpo_offset += count( $lipishilpo_sites );
	} while ( count( $lipishilpo_sites ) === 100 );
	if ( $lipishilpo_delete_shared && $lipishilpo_offset > 0 ) {
		lipishilpo_uninstall_shared_preferences();
	}
} else {
	$lipishilpo_delete_shared = get_option( 'lipishilpo_delete_data_on_uninstall' ) === '1';
	lipishilpo_uninstall_single_site();
	if ( $lipishilpo_delete_shared ) {
		lipishilpo_uninstall_shared_preferences();
	}
}
