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
 *   POST   /wp-json/lipishilpo/v1/publish
 *   GET    /wp-json/lipishilpo/v1/prefs
 *   PUT    /wp-json/lipishilpo/v1/prefs
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Projects {

	const POST_TYPE       = 'lipishilpo_project';
	const META_CHAPTERS   = '_lipishilpo_chapters';
	const META_GENRE      = '_lipishilpo_genre';
	const META_LANGUAGE   = '_lipishilpo_language';
	const META_SNAPSHOTS  = '_lipishilpo_snapshots';
	const META_COMMENTS   = '_lipishilpo_comments';
	const META_EDITS      = '_lipishilpo_edits';
	const USER_DICT       = '_lipishilpo_personal_dict';
	const USER_GOAL       = '_lipishilpo_daily_target';
	const USER_STREAK     = '_lipishilpo_streak_count';
	const USER_STREAK_DAY = '_lipishilpo_last_streak_date';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'          => array(
					'name'          => __( 'Manuscripts', 'lipishilpo' ),
					'singular_name' => __( 'Manuscript', 'lipishilpo' ),
				),
				'public'          => false,
				'show_ui'         => false,
				'show_in_rest'    => false,
				'supports'        => array( 'title', 'custom-fields' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
			)
		);
	}

	public static function register_routes() {
		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/projects',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_projects' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
					'args'                => array(
						'page'     => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 40,
							'minimum' => 1,
							'maximum' => 50,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'create_project' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
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
					'permission_callback' => array( __CLASS__, 'require_writer' ),
					'args'                => array( 'id' => array( 'validate_callback' => 'is_numeric' ) ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_project' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
					'args'                => self::project_args( false ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_project' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
					'args'                => array( 'id' => array( 'validate_callback' => 'is_numeric' ) ),
				),
			)
		);

		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/publish',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'publish_to_wordpress' ),
					'permission_callback' => array( __CLASS__, 'require_publish_permission' ),
				),
			)
		);

		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/prefs',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_prefs' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_prefs' ),
					'permission_callback' => array( __CLASS__, 'require_writer' ),
				),
			)
		);
	}

	public static function require_writer() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'lipishilpo_auth', __( 'Please sign in to continue.', 'lipishilpo' ), array( 'status' => 401 ) );
		}
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'lipishilpo_auth', __( 'You need permission to create or edit posts to use Lipishilpo.', 'lipishilpo' ), array( 'status' => 403 ) );
		}
		return true;
	}

	private static function project_args( $require_title = true ) {
		return array(
			'title'     => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'required'          => $require_title,
				'maxLength'         => 200,
			),
			'genre'     => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'General Writing',
				'maxLength'         => 80,
			),
			'language'  => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'English',
				'maxLength'         => 40,
			),
			'chapters'  => array(
				'type'    => 'array',
				'default' => array(),
				'items'   => array( 'type' => 'object' ),
			),
			'snapshots' => array(
				'type' => 'object',
			),
			'comments'  => array(
				'type' => 'object',
			),
			'edits'     => array(
				'type' => 'object',
			),
		);
	}

	private static function owns_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== self::POST_TYPE ) {
			return false;
		}
		$is_owner = (int) $post->post_author === get_current_user_id();
		/**
		 * Filters whether the current user has access to edit/view a manuscript.
		 * Default: strictly author-only for creative manuscript privacy.
		 *
		 * @param bool $is_owner Whether current user is the post author.
		 * @param int  $post_id  The manuscript post ID.
		 * @param int  $user_id  The current user ID.
		 */
		return (bool) apply_filters( 'lipishilpo_can_access_project', $is_owner, $post_id, get_current_user_id() );
	}

	private static function sanitize_chapters( $chapters ) {
		if ( ! is_array( $chapters ) ) {
			return array();
		}

		$clean = array();
		foreach ( $chapters as $c ) {
			if ( ! is_array( $c ) ) {
				continue;
			}
			$clean[] = array(
				'id'    => ! empty( $c['id'] ) ? sanitize_text_field( $c['id'] ) : wp_generate_uuid4(),
				'title' => isset( $c['title'] ) ? sanitize_text_field( $c['title'] ) : '',
				'text'  => isset( $c['text'] ) ? wp_kses_post( $c['text'] ) : '',
				'notes' => isset( $c['notes'] ) ? wp_kses_post( $c['notes'] ) : '',
			);
		}

		return $clean;
	}

	private static function sanitize_snapshots( $map ) {
		if ( ! is_array( $map ) ) {
			return array();
		}

		$out = array();
		foreach ( $map as $chapter_id => $items ) {
			if ( ! is_array( $items ) ) {
				continue;
			}
			$cid   = sanitize_text_field( (string) $chapter_id );
			$clean = array();
			foreach ( array_slice( $items, 0, 40 ) as $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				$clean[] = array(
					'id'        => ! empty( $item['id'] ) ? sanitize_text_field( $item['id'] ) : wp_generate_uuid4(),
					'name'      => isset( $item['name'] ) ? sanitize_text_field( $item['name'] ) : '',
					'date'      => isset( $item['date'] ) ? sanitize_text_field( $item['date'] ) : '',
					'wordCount' => isset( $item['wordCount'] ) ? absint( $item['wordCount'] ) : 0,
					'text'      => isset( $item['text'] ) ? wp_kses_post( $item['text'] ) : '',
				);
			}
			$out[ $cid ] = $clean;
		}

		return $out;
	}

	private static function sanitize_comments( $map ) {
		if ( ! is_array( $map ) ) {
			return array();
		}

		$out = array();
		foreach ( $map as $chapter_id => $items ) {
			if ( ! is_array( $items ) ) {
				continue;
			}
			$cid   = sanitize_text_field( (string) $chapter_id );
			$clean = array();
			foreach ( array_slice( $items, 0, 100 ) as $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				$clean[] = array(
					'id'       => ! empty( $item['id'] ) ? sanitize_text_field( $item['id'] ) : wp_generate_uuid4(),
					'quote'    => isset( $item['quote'] ) ? sanitize_textarea_field( $item['quote'] ) : '',
					'comment'  => isset( $item['comment'] ) ? sanitize_textarea_field( $item['comment'] ) : '',
					'date'     => isset( $item['date'] ) ? sanitize_text_field( $item['date'] ) : '',
					'resolved' => ! empty( $item['resolved'] ),
				);
			}
			$out[ $cid ] = $clean;
		}

		return $out;
	}

	private static function sanitize_edits( $map ) {
		if ( ! is_array( $map ) ) {
			return array();
		}

		$allowed = array( 'spelling', 'grammar', 'style', 'punctuation', 'replace', 'custom' );
		$out     = array();
		foreach ( $map as $chapter_id => $items ) {
			if ( ! is_array( $items ) ) {
				continue;
			}
			$cid   = sanitize_text_field( (string) $chapter_id );
			$clean = array();
			foreach ( array_slice( $items, 0, 200 ) as $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				$kind = isset( $item['kind'] ) ? sanitize_key( (string) $item['kind'] ) : 'spelling';
				if ( ! in_array( $kind, $allowed, true ) ) {
					$kind = 'spelling';
				}
				$clean[] = array(
					'id'          => ! empty( $item['id'] ) ? sanitize_text_field( $item['id'] ) : wp_generate_uuid4(),
					'kind'        => $kind,
					'from'        => isset( $item['from'] ) ? sanitize_textarea_field( (string) $item['from'] ) : '',
					'to'          => isset( $item['to'] ) ? sanitize_textarea_field( (string) $item['to'] ) : '',
					'why'         => isset( $item['why'] ) ? sanitize_textarea_field( (string) $item['why'] ) : '',
					'count'       => isset( $item['count'] ) ? absint( $item['count'] ) : 1,
					'date'        => isset( $item['date'] ) ? sanitize_text_field( (string) $item['date'] ) : '',
					'customized'  => ! empty( $item['customized'] ),
				);
			}
			$out[ $cid ] = $clean;
		}

		return $out;
	}

	private static function format_project( $post ) {
		$chapters = get_post_meta( $post->ID, self::META_CHAPTERS, true );
		if ( ! is_array( $chapters ) ) {
			$chapters = array();
		}
		$chapters = self::sanitize_chapters( $chapters );

		$snapshots = get_post_meta( $post->ID, self::META_SNAPSHOTS, true );
		$comments  = get_post_meta( $post->ID, self::META_COMMENTS, true );
		$edits     = get_post_meta( $post->ID, self::META_EDITS, true );

		return array(
			'id'        => $post->ID,
			'title'     => $post->post_title,
			'genre'     => get_post_meta( $post->ID, self::META_GENRE, true ) ?: 'General Writing',
			'language'  => get_post_meta( $post->ID, self::META_LANGUAGE, true ) ?: 'English',
			'chapters'  => $chapters,
			'snapshots' => ! empty( $snapshots ) && is_array( $snapshots ) ? (object) $snapshots : (object) array(),
			'comments'  => ! empty( $comments ) && is_array( $comments ) ? (object) $comments : (object) array(),
			'edits'     => ! empty( $edits ) && is_array( $edits ) ? (object) $edits : (object) array(),
			'created'   => $post->post_date,
			'modified'  => $post->post_modified,
		);
	}

	public static function get_projects( $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = min( 50, max( 1, (int) ( $request->get_param( 'per_page' ) ?: 40 ) ) );

		$query = new WP_Query(
			array(
				'post_type'      => self::POST_TYPE,
				'post_status'    => 'publish',
				'author'         => get_current_user_id(),
				'posts_per_page' => $per_page,
				'paged'          => $page,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'no_found_rows'  => false,
			)
		);

		$items = array_map( array( __CLASS__, 'format_project' ), $query->posts );

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) (int) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (string) (int) $query->max_num_pages );
		return $response;
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
		$chapters = self::sanitize_chapters( $request->get_param( 'chapters' ) ?: array() );

		if ( empty( $title ) ) {
			return new WP_Error( 'lipishilpo_invalid', __( 'Project title is required.', 'lipishilpo' ), array( 'status' => 400 ) );
		}

		if ( empty( $chapters ) ) {
			$chapters = array(
				array(
					'id'    => wp_generate_uuid4(),
					'title' => 'Chapter 1',
					'text'  => '',
					'notes' => '',
				),
			);
		}

		$limit_error = self::validate_chapter_limits( $chapters );
		if ( $limit_error ) {
			return $limit_error;
		}

		$post_id = wp_insert_post(
			array(
				'post_type'   => self::POST_TYPE,
				'post_title'  => $title,
				'post_status' => 'publish',
				'post_author' => get_current_user_id(),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'lipishilpo_db', __( 'Failed to create project.', 'lipishilpo' ), array( 'status' => 500 ) );
		}

		update_post_meta( $post_id, self::META_GENRE, $genre );
		update_post_meta( $post_id, self::META_LANGUAGE, $language );
		update_post_meta( $post_id, self::META_CHAPTERS, $chapters );
		update_post_meta( $post_id, self::META_SNAPSHOTS, array() );
		update_post_meta( $post_id, self::META_COMMENTS, array() );
		update_post_meta( $post_id, self::META_EDITS, array() );

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
			$chapters    = self::sanitize_chapters( $request->get_param( 'chapters' ) );
			$limit_error = self::validate_chapter_limits( $chapters );
			if ( $limit_error ) {
				return $limit_error;
			}
			update_post_meta( $id, self::META_CHAPTERS, $chapters );
		}
		if ( $request->has_param( 'snapshots' ) ) {
			update_post_meta( $id, self::META_SNAPSHOTS, self::sanitize_snapshots( $request->get_param( 'snapshots' ) ) );
		}
		if ( $request->has_param( 'comments' ) ) {
			update_post_meta( $id, self::META_COMMENTS, self::sanitize_comments( $request->get_param( 'comments' ) ) );
		}
		if ( $request->has_param( 'edits' ) ) {
			update_post_meta( $id, self::META_EDITS, self::sanitize_edits( $request->get_param( 'edits' ) ) );
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

	public static function require_publish_permission() {
		if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'lipishilpo_auth', __( 'Permission denied to create or edit posts.', 'lipishilpo' ), array( 'status' => 403 ) );
		}
		return true;
	}

	public static function publish_to_wordpress( $request ) {
		$title     = sanitize_text_field( $request->get_param( 'title' ) ?: 'Untitled Draft' );
		$content   = wp_kses_post( $request->get_param( 'content' ) ?: '' );
		$status    = $request->get_param( 'status' ) === 'publish' ? 'publish' : 'draft';
		$post_type = $request->get_param( 'post_type' ) === 'page' ? 'page' : 'post';

		if ( $status === 'publish' ) {
			$cap = $post_type === 'page' ? 'publish_pages' : 'publish_posts';
			if ( ! current_user_can( $cap ) ) {
				return new WP_Error(
					'lipishilpo_auth',
					__( 'You do not have permission to publish. Save as a draft instead.', 'lipishilpo' ),
					array( 'status' => 403 )
				);
			}
		}

		if ( $post_type === 'page' && ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error( 'lipishilpo_auth', __( 'You do not have permission to create pages.', 'lipishilpo' ), array( 'status' => 403 ) );
		}

		$post_id = wp_insert_post(
			array(
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => $status,
				'post_type'    => $post_type,
				'post_author'  => get_current_user_id(),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'postId'  => $post_id,
				'editUrl' => get_edit_post_link( $post_id, 'raw' ) ?: admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
				'viewUrl' => get_permalink( $post_id ) ?: admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
				'status'  => $status,
			)
		);
	}

	public static function get_prefs() {
		$user_id = get_current_user_id();
		$dict    = get_user_meta( $user_id, self::USER_DICT, true );

		return rest_ensure_response(
			array(
				'dictionary'     => is_array( $dict ) ? array_values( array_map( 'sanitize_text_field', $dict ) ) : array(),
				'dailyTarget'    => max( 50, absint( get_user_meta( $user_id, self::USER_GOAL, true ) ?: 500 ) ),
				'streak'         => absint( get_user_meta( $user_id, self::USER_STREAK, true ) ),
				'lastStreakDate' => sanitize_text_field( (string) get_user_meta( $user_id, self::USER_STREAK_DAY, true ) ),
			)
		);
	}

	public static function update_prefs( $request ) {
		$user_id = get_current_user_id();
		$body    = $request->get_json_params();
		if ( ! is_array( $body ) ) {
			$body = array();
		}

		if ( isset( $body['dictionary'] ) && is_array( $body['dictionary'] ) ) {
			$dict = array();
			foreach ( array_slice( $body['dictionary'], 0, 500 ) as $word ) {
				$word = sanitize_text_field( (string) $word );
				if ( $word !== '' ) {
					$dict[] = $word;
				}
			}
			update_user_meta( $user_id, self::USER_DICT, array_values( array_unique( $dict ) ) );
		}

		if ( isset( $body['dailyTarget'] ) ) {
			update_user_meta( $user_id, self::USER_GOAL, max( 50, min( 50000, absint( $body['dailyTarget'] ) ) ) );
		}

		if ( isset( $body['streak'] ) ) {
			update_user_meta( $user_id, self::USER_STREAK, absint( $body['streak'] ) );
		}

		if ( isset( $body['lastStreakDate'] ) ) {
			update_user_meta( $user_id, self::USER_STREAK_DAY, sanitize_text_field( (string) $body['lastStreakDate'] ) );
		}

		return self::get_prefs();
	}

	private static function validate_chapter_limits( $chapters ) {
		if ( count( $chapters ) > 200 ) {
			return new WP_Error( 'lipishilpo_limit', __( 'Maximum 200 chapters allowed per project.', 'lipishilpo' ), array( 'status' => 400 ) );
		}
		$total = 0;
		foreach ( $chapters as $c ) {
			$total += strlen( isset( $c['text'] ) ? $c['text'] : '' );
		}
		if ( $total > 500000 ) {
			return new WP_Error( 'lipishilpo_limit', __( 'Total character count exceeds the limit.', 'lipishilpo' ), array( 'status' => 400 ) );
		}
		return null;
	}

	public static function create_tables() {
		// Reserved for future custom table migrations.
	}
}
