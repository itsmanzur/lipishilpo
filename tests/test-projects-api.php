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
}
