<?php
/**
 * Unit & Integration Tests for Lipishilpo Projects REST API
 */

class Test_Lipishilpo_Projects_API extends WP_UnitTestCase {

	protected $user_id;

	public function setUp(): void {
		parent::setUp();
		$this->user_id = $this->factory->user->create( array( 'role' => 'author' ) );
	}

	public function test_format_project_returns_empty_object_for_maps() {
		wp_set_current_user( $this->user_id );

		$request = new WP_REST_Request( 'POST', '/lipishilpo/v1/projects' );
		$request->set_param( 'title', 'My Test Book' );
		$request->set_param( 'chapters', array(
			array( 'title' => 'Chapter 1', 'text' => 'Sample body text' ),
		) );

		$response = Lipishilpo_Projects::create_project( $request );
		$data     = $response->get_data();

		$this->assertEquals( 201, $response->get_status() );
		$this->assertIsObject( $data['snapshots'] );
		$this->assertIsObject( $data['comments'] );
		$this->assertIsObject( $data['edits'] );
	}

	public function test_chapter_limits_validated_before_creation() {
		wp_set_current_user( $this->user_id );

		$many_chapters = array_fill( 0, 205, array( 'title' => 'Ch', 'text' => 'Text' ) );
		$request = new WP_REST_Request( 'POST', '/lipishilpo/v1/projects' );
		$request->set_param( 'title', 'Too Long Book' );
		$request->set_param( 'chapters', $many_chapters );

		$response = Lipishilpo_Projects::create_project( $request );
		$this->assertTrue( is_wp_error( $response ) );
		$this->assertEquals( 'lipishilpo_limit', $response->get_error_code() );
	}

	public function test_author_privacy_ownership_protection() {
		$other_user = $this->factory->user->create( array( 'role' => 'author' ) );

		wp_set_current_user( $this->user_id );
		$request = new WP_REST_Request( 'POST', '/lipishilpo/v1/projects' );
		$request->set_param( 'title', 'Private Diary' );
		$response = Lipishilpo_Projects::create_project( $request );
		$project_id = $response->get_data()['id'];

		// Switch to other author
		wp_set_current_user( $other_user );
		$get_request = new WP_REST_Request( 'GET', '/lipishilpo/v1/projects/' . $project_id );
		$get_request['id'] = $project_id;
		$get_response = Lipishilpo_Projects::get_project( $get_request );

		$this->assertTrue( is_wp_error( $get_response ) );
		$this->assertEquals( 'lipishilpo_not_found', $get_response->get_error_code() );
	}

	public function test_chapter_status_workflow_sanitization() {
		wp_set_current_user( $this->user_id );

		$request = new WP_REST_Request( 'POST', '/lipishilpo/v1/projects' );
		$request->set_param( 'title', 'Workflow Novel' );
		$request->set_param( 'chapters', array(
			array( 'title' => 'Ch 1', 'text' => 'Draft text', 'status' => 'revised' ),
			array( 'title' => 'Ch 2', 'text' => 'Final text', 'status' => 'invalid_status' ),
		) );

		$response = Lipishilpo_Projects::create_project( $request );
		$data     = $response->get_data();

		$this->assertEquals( 201, $response->get_status() );
		$this->assertEquals( 'revised', $data['chapters'][0]['status'] );
		$this->assertEquals( 'draft', $data['chapters'][1]['status'] ); // invalid falls back to draft
	}

	public function test_project_update_and_snapshots() {
		wp_set_current_user( $this->user_id );

		$create_req = new WP_REST_Request( 'POST', '/lipishilpo/v1/projects' );
		$create_req->set_param( 'title', 'Snapshot Test' );
		$create_res = Lipishilpo_Projects::create_project( $create_req );
		$project_id = $create_res->get_data()['id'];

		$update_req = new WP_REST_Request( 'PUT', '/lipishilpo/v1/projects/' . $project_id );
		$update_req['id'] = $project_id;
		$update_req->set_param( 'revision', $create_res->get_data()['revision'] );
		$update_req->set_param( 'title', 'Updated Snapshot Test' );
		$update_req->set_param( 'snapshots', array(
			'ch-1' => array(
				array( 'id' => 's1', 'name' => 'Draft 1', 'text' => 'Old content', 'date' => 'Sep 8' ),
			),
		) );

		$update_res = Lipishilpo_Projects::update_project( $update_req );
		$updated_data = $update_res->get_data();

		$this->assertEquals( 200, $update_res->get_status() );
		$this->assertEquals( 'Updated Snapshot Test', $updated_data['title'] );
	}

	private function dispatch_json( $method, $route, $body ) {
		wp_set_current_user( $this->user_id );
		if ( 'PUT' === $method && ! isset( $body['revision'] ) ) {
			$body['revision'] = $this->dispatch_json( 'GET', $route, array() )->get_data()['revision'];
		}
		$request = new WP_REST_Request( $method, '/lipishilpo/v1' . $route );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		return rest_do_request( $request );
	}

	public function test_partial_update_via_rest_preserves_omitted_fields() {
		$created = $this->dispatch_json( 'POST', '/projects', array(
			'title' => 'Original', 'genre' => 'Novel', 'language' => 'বাংলা',
			'chapters' => array( array( 'id' => 'ch1', 'title' => 'One', 'text' => 'Keep my manuscript' ) ),
		) );
		$this->assertSame( 201, $created->get_status() );
		$original = $created->get_data();
		$result = $this->dispatch_json( 'PUT', '/projects/' . $original['id'], array( 'title' => 'Renamed' ) );
		$this->assertSame( 200, $result->get_status() );
		$data = $result->get_data();
		$this->assertSame( $original['chapters'], $data['chapters'] );
		$this->assertSame( 'Novel', $data['genre'] );
		$this->assertSame( 'বাংলা', $data['language'] );
	}

	public function test_shrink_backup_survives_client_snapshot_payload_and_next_save() {
		$original_text = str_repeat( 'Long manuscript ', 200 );
		$created = $this->dispatch_json( 'POST', '/projects', array(
			'title' => 'Shrink test',
			'chapters' => array( array( 'id' => 'ch1', 'text' => $original_text ) ),
		) )->get_data();
		$body = array( 'chapters' => array( array( 'id' => 'ch1', 'text' => 'Short' ) ), 'snapshots' => (object) array() );
		$first = $this->dispatch_json( 'PUT', '/projects/' . $created['id'], $body );
		$this->assertSame( 200, $first->get_status() );
		$snapshots = (array) $first->get_data()['snapshots'];
		$this->assertSame( $original_text, $snapshots['ch1'][0]['text'] );
		$second = $this->dispatch_json( 'PUT', '/projects/' . $created['id'], $body );
		$snapshots = (array) $second->get_data()['snapshots'];
		$this->assertCount( 1, $snapshots['ch1'] );
		$this->assertSame( $original_text, $snapshots['ch1'][0]['text'] );
	}

	public function test_codex_and_backup_metadata_survive_create_and_reload() {
		$codex = array( 'characters' => array( array( 'id' => 'c1', 'name' => 'নাম', 'role' => 'supporting' ) ), 'lore' => array() );
		$created = $this->dispatch_json( 'POST', '/projects', array(
			'title' => 'Backup restore', 'codex' => $codex,
			'chapters' => array( array( 'id' => 'ch1', 'text' => 'Text', 'status' => 'final', 'partTitle' => 'Part I' ) ),
			'comments' => array( 'ch1' => array( array( 'id' => 'comment1', 'comment' => 'Keep this' ) ) ),
		) );
		$this->assertSame( 201, $created->get_status() );
		$id = $created->get_data()['id'];
		$loaded = $this->dispatch_json( 'GET', '/projects/' . $id, array() )->get_data();
		$this->assertSame( $codex, $loaded['codex'] );
		$this->assertSame( 'final', $loaded['chapters'][0]['status'] );
		$this->assertSame( 'Part I', $loaded['chapters'][0]['partTitle'] );
		$this->assertSame( 'Keep this', ((array) $loaded['comments'])['ch1'][0]['comment'] );
		$codex['characters'][0]['name'] = 'Updated';
		$this->dispatch_json( 'PUT', '/projects/' . $id, array( 'codex' => $codex ) );
		$loaded = $this->dispatch_json( 'GET', '/projects/' . $id, array() )->get_data();
		$this->assertSame( $codex, $loaded['codex'] );
		$this->assertSame( 'Text', $loaded['chapters'][0]['text'] );
	}
}
