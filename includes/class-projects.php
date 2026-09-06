<?php
/**
 * Projects REST API — Lipishilpo (Free)
 *
 * Custom Post Type: lipishilpo_project
 * Endpoints:
 *   GET    /wp-json/lipishilpo/v1/projects
 *   POST   /wp-json/lipishilpo/v1/projects
 *   GET    /wp-json/lipishilpo/v1/projects/{id}
 *   PUT    /wp-json/lipishilpo/v1/projects/{id}
 *   DELETE /wp-json/lipishilpo/v1/projects/{id}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Projects {

	const POST_TYPE     = 'lipishilpo_project';
	const META_CHAPTERS = '_lipishilpo_chapters';
	const META_GENRE    = '_lipishilpo_genre';
	const META_LANGUAGE = '_lipishilpo_language';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	// ── Custom Post Type ───────────────────────────────────────────────────
	public static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'             => array(
					'name'          => __( 'Manuscripts', 'lipishilpo' ),
					'singular_name' => __( 'Manuscript', 'lipishilpo' ),
				),
				'public'             => false,
				'show_ui'            => false,
				'show_in_rest'       => false,
				'supports'           => array( 'title', 'custom-fields' ),
				'capability_type'    => 'post',
				'map_meta_cap'       => true,
			)
		);
	}

	// ── REST Routes ────────────────────────────────────────────────────────
	public static function register_routes() {
		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/projects',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_projects' ),
					'permission_callback' => array( __CLASS__, 'require_login' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'create_project' ),
					'permission_callback' => array( __CLASS__, 'require_login' ),
					'args'                => self::project_args(),
				),
			)
		);

		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/projects/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_project' ),
					'permission_callback' => array( __CLASS__, 'require_login' ),
					'args'                => array( 'id' => array( 'validate_callback' => 'is_numeric' ) ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_project' ),
					'permission_callback' => array( __CLASS__, 'require_login' ),
					'args'                => self::project_args( false ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_project' ),
					'permission_callback' => array( __CLASS__, 'require_login' ),
					'args'                => array( 'id' => array( 'validate_callback' => 'is_numeric' ) ),
				),
			)
		);
	}

	// ── Permission ─────────────────────────────────────────────────────────
	public static function require_login() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'lipishilpo_auth', __( 'Please sign in to continue.', 'lipishilpo' ), array( 'status' => 401 ) );
		}
		return true;
	}

	// ── Helpers ────────────────────────────────────────────────────────────
	private static function project_args( $require_title = true ) {
		return array(
			'title'    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'required'          => $require_title,
				'maxLength'         => 200,
			),
			'genre'    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'General Writing',
				'maxLength'         => 80,
			),
			'language' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'English',
				'maxLength'         => 40,
			),
			'chapters' => array(
				'type'     => 'array',
				'default'  => array(),
				'items'    => array( 'type' => 'object' ),
			),
		);
	}

	private static function owns_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== self::POST_TYPE ) {
			return false;
		}
		return (int) $post->post_author === get_current_user_id();
	}

	private static function format_project( $post ) {
		$chapters = get_post_meta( $post->ID, self::META_CHAPTERS, true );
		if ( ! is_array( $chapters ) ) {
			$chapters = array();
		}
		$chapters = array_map( function( $c ) {
			return array(
				'id'    => isset( $c['id'] ) ? sanitize_text_field( $c['id'] ) : wp_generate_uuid4(),
				'title' => isset( $c['title'] ) ? sanitize_text_field( $c['title'] ) : '',
				'text'  => isset( $c['text'] ) ? wp_kses_post( $c['text'] ) : '',
			);
		}, $chapters );

		return array(
			'id'       => $post->ID,
			'title'    => $post->post_title,
			'genre'    => get_post_meta( $post->ID, self::META_GENRE, true ) ?: 'General Writing',
			'language' => get_post_meta( $post->ID, self::META_LANGUAGE, true ) ?: 'English',
			'chapters' => $chapters,
			'created'  => $post->post_date,
			'modified' => $post->post_modified,
		);
	}

	// ── CRUD Callbacks ─────────────────────────────────────────────────────

	public static function get_projects( $request ) {
		$posts = get_posts( array(
			'post_type'      => self::POST_TYPE,
			'post_status'    => 'publish',
			'author'         => get_current_user_id(),
			'posts_per_page' => 100,
			'orderby'        => 'modified',
			'order'          => 'DESC',
		) );

		return rest_ensure_response( array_map( array( __CLASS__, 'format_project' ), $posts ) );
	}

	public static function get_project( $request ) {
		$id = (int) $request['id'];
		if ( ! self::owns_post( $id ) ) {
			return new WP_Error( 'lipishilpo_not_found', __( 'Manuscript not found.', 'lipishilpo' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( self::format_project( get_post( $id ) ) );
	}

	public static function create_project( $request ) {
		$title    = sanitize_text_field( $request->get_param( 'title' ) );
		$genre    = sanitize_text_field( $request->get_param( 'genre' ) ?: 'General Writing' );
		$language = sanitize_text_field( $request->get_param( 'language' ) ?: 'English' );
		$chapters = $request->get_param( 'chapters' ) ?: array();

		if ( empty( $title ) ) {
			return new WP_Error( 'lipishilpo_invalid', __( 'Project title is required.', 'lipishilpo' ), array( 'status' => 400 ) );
		}

		$post_id = wp_insert_post( array(
			'post_type'   => self::POST_TYPE,
			'post_title'  => $title,
			'post_status' => 'publish',
			'post_author' => get_current_user_id(),
		), true );

		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'lipishilpo_db', __( 'Failed to create project.', 'lipishilpo' ), array( 'status' => 500 ) );
		}

		if ( empty( $chapters ) ) {
			$chapters = array( array(
				'id'    => wp_generate_uuid4(),
				'title' => 'Chapter 1',
				'text'  => '',
			) );
		}

		update_post_meta( $post_id, self::META_GENRE, $genre );
		update_post_meta( $post_id, self::META_LANGUAGE, $language );
		update_post_meta( $post_id, self::META_CHAPTERS, $chapters );

		$response = rest_ensure_response( self::format_project( get_post( $post_id ) ) );
		$response->set_status( 201 );
		return $response;
	}

	public static function update_project( $request ) {
		$id = (int) $request['id'];
		if ( ! self::owns_post( $id ) ) {
			return new WP_Error( 'lipishilpo_not_found', __( 'Manuscript not found.', 'lipishilpo' ), array( 'status' => 404 ) );
		}

		$update = array( 'ID' => $id );

		if ( $request->has_param( 'title' ) ) {
			$title = sanitize_text_field( $request->get_param( 'title' ) );
			if ( empty( $title ) ) {
				return new WP_Error( 'lipishilpo_invalid', __( 'Project title is required.', 'lipishilpo' ), array( 'status' => 400 ) );
			}
			$update['post_title'] = $title;
		}

		if ( count( $update ) > 1 ) {
			wp_update_post( $update );
		}

		if ( $request->has_param( 'genre' ) ) {
			update_post_meta( $id, self::META_GENRE, sanitize_text_field( $request->get_param( 'genre' ) ) );
		}
		if ( $request->has_param( 'language' ) ) {
			update_post_meta( $id, self::META_LANGUAGE, sanitize_text_field( $request->get_param( 'language' ) ) );
		}
		if ( $request->has_param( 'chapters' ) ) {
			$chapters = $request->get_param( 'chapters' );
			if ( count( $chapters ) > 200 ) {
				return new WP_Error( 'lipishilpo_limit', __( 'Maximum 200 chapters allowed per project.', 'lipishilpo' ), array( 'status' => 400 ) );
			}
			$total = array_sum( array_map( fn($c) => strlen( $c['text'] ?? '' ), $chapters ) );
			if ( $total > 500000 ) {
				return new WP_Error( 'lipishilpo_limit', __( 'Total character count exceeds the limit.', 'lipishilpo' ), array( 'status' => 400 ) );
			}
			update_post_meta( $id, self::META_CHAPTERS, $chapters );
		}

		return rest_ensure_response( self::format_project( get_post( $id ) ) );
	}

	public static function delete_project( $request ) {
		$id = (int) $request['id'];
		if ( ! self::owns_post( $id ) ) {
			return new WP_Error( 'lipishilpo_not_found', __( 'Manuscript not found.', 'lipishilpo' ), array( 'status' => 404 ) );
		}

		$deleted = wp_delete_post( $id, true );
		if ( ! $deleted ) {
			return new WP_Error( 'lipishilpo_db', __( 'Failed to delete manuscript.', 'lipishilpo' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'deleted' => true, 'id' => $id ) );
	}

	public static function create_tables() {
		// Reserved for future custom table migrations
	}
}
