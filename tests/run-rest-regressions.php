<?php
/** CLI smoke tests against a LOCAL WordPress database. Temporary fixtures are deleted. */
if ( PHP_SAPI !== 'cli' || empty( $argv[1] ) ) {
	exit( "Usage: php tests/run-rest-regressions.php /path/to/wp-load.php\n" );
}
// Isolate the plugin under test from unrelated plugin startup and network requests.
$GLOBALS['wp_filter']['option_active_plugins'][10][] = array( 'function' => function() { return array(); }, 'accepted_args' => 1 );
$GLOBALS['wp_filter']['site_option_active_sitewide_plugins'][10][] = array( 'function' => function() { return array(); }, 'accepted_args' => 1 );
require $argv[1];
require_once dirname( __DIR__ ) . '/lipishilpo.php';
lipishilpo_init();
Lipishilpo_Projects::register_post_type();
require_once ABSPATH . 'wp-admin/includes/user.php';

$fixture_ids = array();
$fixture_user = 0;
function lipishilpo_test_assert( $condition, $message ) {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
}
function lipishilpo_test_request( $method, $route, $body = array() ) {
	if ( 'PUT' === $method && ! array_key_exists( 'revision', $body ) ) {
		$current = lipishilpo_test_request( 'GET', $route )->get_data();
		$body['revision'] = $current['revision'];
	}

	$request = new WP_REST_Request( $method, '/lipishilpo/v1' . $route );
	$request->set_header( 'Content-Type', 'application/json' );
	$request->set_body( wp_json_encode( $body ) );
	return rest_do_request( $request );
}
try {
	$fixture_user = wp_insert_user( array( 'user_login' => 'lipishilpo_test_' . wp_generate_uuid4(), 'user_pass' => wp_generate_password(), 'role' => 'author' ) );
	lipishilpo_test_assert( ! is_wp_error( $fixture_user ), 'Could not create test author' );
	wp_set_current_user( $fixture_user );
	$original_text = str_repeat( 'বাংলা manuscript ', 250 );
	$codex = array( 'characters' => array( array( 'id' => 'c1', 'name' => 'Character', 'role' => 'supporting' ) ), 'lore' => array() );
	$created = lipishilpo_test_request( 'POST', '/projects', array(
		'title' => 'Temporary regression fixture', 'genre' => 'Novel', 'language' => 'বাংলা', 'codex' => $codex,
		'chapters' => array( array( 'id' => 'ch1', 'text' => $original_text, 'status' => 'final', 'partTitle' => 'Part I' ) ),
		'comments' => array( 'ch1' => array( array( 'id' => 'comment1', 'comment' => 'Keep this' ) ) ),
	) );
	lipishilpo_test_assert( $created->get_status() === 201, 'Create failed: ' . wp_json_encode( $created->get_data() ) );
	$data = $created->get_data();
	$id = $data['id'];
	$fixture_ids[] = $id;
	$partial = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'title' => 'Renamed' ) );
	lipishilpo_test_assert( $partial->get_status() === 200, 'Partial update failed' );
	$changed = $partial->get_data();
	foreach ( array( 'chapters', 'genre', 'language', 'codex' ) as $key ) {
		lipishilpo_test_assert( $changed[ $key ] === $data[ $key ], 'Partial update changed omitted ' . $key );
	}
	echo "PASS: REST partial update preserves chapters, genre, language and codex\n";
	$codex['characters'][0]['name'] = 'Updated character';
	lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'codex' => $codex ) );
	$loaded = lipishilpo_test_request( 'GET', '/projects/' . $id )->get_data();
	lipishilpo_test_assert( $loaded['codex'] === $codex, 'Codex did not persist' );
	lipishilpo_test_assert( $loaded['chapters'][0]['status'] === 'final' && $loaded['chapters'][0]['partTitle'] === 'Part I', 'Chapter metadata did not persist' );
	lipishilpo_test_assert( ((array) $loaded['comments'])['ch1'][0]['comment'] === 'Keep this', 'Imported comments lost' );
	echo "PASS: codex, imported comments, chapter status and part title survive reload\n";
	$invalid = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'title' => 'Must not change', 'chapters' => array_fill( 0, 201, array( 'text' => 'Text' ) ) ) );
	lipishilpo_test_assert( $invalid->get_status() === 400, 'Oversized update accepted' );
	lipishilpo_test_assert( get_post( $id )->post_title === 'Renamed', 'Rejected update changed title' );
	echo "PASS: invalid chapter payload leaves title unchanged\n";
	$body = array( 'chapters' => array( array( 'id' => 'ch1', 'text' => 'Short' ) ), 'snapshots' => (object) array() );
	foreach ( array( 1, 2 ) as $attempt ) {
		$saved = lipishilpo_test_request( 'PUT', '/projects/' . $id, $body );
		lipishilpo_test_assert( $saved->get_status() === 200, 'Shrink update failed' );
		$snapshots = (array) $saved->get_data()['snapshots'];
		lipishilpo_test_assert( count( $snapshots['ch1'] ) === 1 && $snapshots['ch1'][0]['text'] === $original_text, 'Automatic backup lost on save ' . $attempt );
	}
	echo "PASS: automatic deletion backup survives current and stale subsequent payloads\n";
	$backup_id = $snapshots['ch1'][0]['id'];
	$deleted = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'deleted_snapshot_ids' => array( $backup_id ) ) );
	$remaining = (array) $deleted->get_data()['snapshots'];
	lipishilpo_test_assert( empty( $remaining['ch1'] ), 'Explicit snapshot deletion was ignored' );
	echo "PASS: explicit automatic snapshot deletion remains available\n";
	// Force an old timestamp without sleeps; a metadata-only save must refresh it.
	global $wpdb;
	$wpdb->update( $wpdb->posts, array( 'post_modified' => '2000-01-01 00:00:00', 'post_modified_gmt' => '2000-01-01 00:00:00' ), array( 'ID' => $id ) );
	clean_post_cache( $id );
	$tab_a = lipishilpo_test_request( 'GET', '/projects/' . $id )->get_data();
	$tab_b = $tab_a;
	$first_save = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'revision' => $tab_a['revision'], 'chapters' => array( array( 'id' => 'ch1', 'text' => 'New winning text' ) ) ) );
	lipishilpo_test_assert( $first_save->get_status() === 200, 'First revision save failed' );
	lipishilpo_test_assert( $first_save->get_data()['modified'] !== '2000-01-01 00:00:00', 'Metadata save did not refresh modified date' );
	$stale_save = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'revision' => $tab_b['revision'], 'chapters' => array( array( 'id' => 'ch1', 'text' => 'Stale losing text' ) ) ) );
	lipishilpo_test_assert( $stale_save->get_status() === 409, 'Stale tab was allowed to overwrite' );
	$latest = lipishilpo_test_request( 'GET', '/projects/' . $id )->get_data();
	lipishilpo_test_assert( $latest['chapters'][0]['text'] === 'New winning text', 'Conflict changed server content' );
	lipishilpo_test_assert( $latest['revision'] === $first_save->get_data()['revision'], 'Rejected save changed revision' );
	$missing = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'revision' => '', 'title' => 'No revision' ) );
	lipishilpo_test_assert( $missing->get_status() === 428, 'Missing revision accepted' );
	echo "PASS: stale tabs and missing revisions cannot overwrite; metadata saves update modified time\n";
	// A separate database connection models another PHP worker holding the write lock.
	$other_db = new wpdb( DB_USER, DB_PASSWORD, DB_NAME, DB_HOST );
	$lock_key = 'lipishilpo_' . substr( hash( 'sha256', DB_NAME . ':' . $wpdb->prefix . ':' . $id ), 0, 48 );
	$other_db->get_var( $other_db->prepare( 'SELECT GET_LOCK(%s, 0)', $lock_key ) );
	try {
		$busy = lipishilpo_test_request( 'PUT', '/projects/' . $id, array( 'revision' => $latest['revision'], 'title' => 'Locked write' ) );
		lipishilpo_test_assert( $busy->get_status() === 503, 'Concurrent worker lock was bypassed' );
	} finally {
		$other_db->get_var( $other_db->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_key ) );
		$other_db->close();
	}
	$after_lock = lipishilpo_test_request( 'GET', '/projects/' . $id )->get_data();
	lipishilpo_test_assert( $after_lock['title'] === 'Renamed', 'Blocked request wrote data' );
	echo "PASS: concurrent database worker cannot bypass project lock\n";
	wp_set_current_user( 0 );
	lipishilpo_test_assert( lipishilpo_test_request( 'GET', '/projects/' . $id )->get_status() === 401, 'Anonymous access allowed' );
	echo "PASS: anonymous project access denied\n";
} catch ( Throwable $error ) {
	fwrite( STDERR, $error->getMessage() . "\n" );
	$exit_code = 1;
} finally {
	foreach ( $fixture_ids as $id ) { wp_delete_post( $id, true ); }
	if ( is_int( $fixture_user ) && $fixture_user > 0 ) { wp_delete_user( $fixture_user ); }
}
exit( $exit_code ?? 0 );
