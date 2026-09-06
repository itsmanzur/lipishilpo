<?php
/**
 * লিপিশিল্প Uninstall
 *
 * Plugin মুছে ফেলার সময় ডেটা পরিষ্কার করা।
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// সব প্রজেক্ট মুছে ফেলা
$posts = get_posts( array(
	'post_type'      => 'lipishilpo_project',
	'posts_per_page' => -1,
	'post_status'    => 'any',
) );

foreach ( $posts as $post ) {
	wp_delete_post( $post->ID, true );
}

// Options মুছে ফেলা
delete_option( 'lipishilpo_openai_key' );
delete_option( 'lipishilpo_openai_model' );
delete_option( 'lipishilpo_license_key' );
delete_option( 'lipishilpo_license_status' );
