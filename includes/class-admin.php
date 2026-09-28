<?php
/**
 * Admin Settings Page — Lipishilpo (Free)
 *
 * Provides general info, shortcode guides, data retention settings, and dashboard styling.
 * When Lipishilpo Pro is active, Pro settings (Universal AI, License) are attached via hooks.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Admin {

	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_init', array( __CLASS__, 'add_privacy_policy_content' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( false === strpos( $hook, 'lipishilpo' ) ) {
			return;
		}

		$css_file = LIPISHILPO_DIR . 'assets/css/lipishilpo-admin.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				'lipishilpo-admin-style',
				LIPISHILPO_URL . 'assets/css/lipishilpo-admin.css',
				array(),
				filemtime( $css_file )
			);
		}

		$js = "function lipishilpoCopyShortcode(btn) {
			if (!navigator.clipboard) return;
			navigator.clipboard.writeText('[lipishilpo]').then(function() {
				var origText = btn.innerHTML;
				btn.classList.add('copied');
				btn.innerHTML = '<span>✓</span> ' + " . wp_json_encode( __( 'Copied!', 'lipishilpo' ) ) . ";
				setTimeout(function() {
					btn.classList.remove('copied');
					btn.innerHTML = origText;
				}, 2000);
			});
		}";
		wp_register_script( 'lipishilpo-admin-inline', false, array(), LIPISHILPO_VERSION, true );
		wp_enqueue_script( 'lipishilpo-admin-inline' );
		wp_add_inline_script( 'lipishilpo-admin-inline', $js );
	}

	public static function register_settings() {
		register_setting(
			'lipishilpo_settings',
			'lipishilpo_delete_data_on_uninstall',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
				'default'           => '0',
			)
		);

		// Hook for Pro addon settings registration
		do_action( 'lipishilpo_register_admin_settings' );
	}

	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Permission denied.', 'lipishilpo' ) );
		}

		$is_pro        = lipishilpo_is_pro();
		$pro_installed = defined( 'LIPISHILPO_PRO_VERSION' );
		$editor_url    = admin_url( 'admin.php?page=lipishilpo' );
		$docs_url      = admin_url( 'admin.php?page=lipishilpo-docs' );
		?>
		<div class="wrap lipishilpo-settings-wrap">
			<!-- Hero Header -->
			<div class="lipishilpo-admin-hero">
				<div class="lipishilpo-hero-content">
					<div class="lipishilpo-hero-badge">
						<span>✨</span> <?php esc_html_e( 'Lipishilpo Studio & AI Hub', 'lipishilpo' ); ?>
					</div>
					<h1><?php esc_html_e( 'Lipishilpo Settings & Configuration', 'lipishilpo' ); ?></h1>
					<p>
						<?php esc_html_e( 'Configure universal AI connectivity, shortcode embed options, and manuscript storage settings.', 'lipishilpo' ); ?>
					</p>
				</div>
				<div class="lipishilpo-hero-actions">
					<a href="<?php echo esc_url( $editor_url ); ?>" class="lipishilpo-hero-btn-primary">
						<span>✍</span> <?php esc_html_e( 'Open Studio', 'lipishilpo' ); ?>
					</a>
					<a href="<?php echo esc_url( $docs_url ); ?>" class="lipishilpo-hero-btn-secondary">
						<span>📖</span> <?php esc_html_e( 'User Guide', 'lipishilpo' ); ?>
					</a>
				</div>
			</div>

			<!-- Pro Status Card -->
			<div class="lipishilpo-status-card <?php echo $is_pro ? 'is-pro' : 'is-free'; ?>">
				<div class="lipishilpo-status-left">
					<div class="lipishilpo-status-icon">
						<?php echo $is_pro ? '💎' : '💡'; ?>
					</div>
					<div>
						<h3 class="lipishilpo-status-title">
							<?php
							if ( $is_pro ) {
								esc_html_e( 'Lipishilpo Pro is Active', 'lipishilpo' );
							} elseif ( $pro_installed ) {
								esc_html_e( 'Lipishilpo Pro Installed (License Inactive)', 'lipishilpo' );
							} else {
								esc_html_e( 'Lipishilpo Core (Free Edition) Active', 'lipishilpo' );
							}
							?>
						</h3>
						<p class="lipishilpo-status-desc">
							<?php
							if ( $is_pro ) {
								esc_html_e( 'Universal AI editorial, full-book continuity intelligence, and print-ready DOCX/PDF/EPUB publication engine are enabled.', 'lipishilpo' );
							} else {
								esc_html_e( 'Bangla Academy standard grammar inspection, offline proofreading, and manuscript outliner are 100% free forever.', 'lipishilpo' );
							}
							?>
						</p>
					</div>
				</div>
				<div>
					<?php if ( $is_pro ) : ?>
						<span class="lipishilpo-pill-badge">
							<span class="lipishilpo-pulse-dot"></span>
							<?php esc_html_e( 'Pro Active', 'lipishilpo' ); ?>
						</span>
					<?php else : ?>
						<span class="lipishilpo-pill-badge">
							<?php esc_html_e( 'Free Core', 'lipishilpo' ); ?>
						</span>
					<?php endif; ?>
				</div>
			</div>

			<form method="post" action="options.php" id="lipishilpo_settings_form">
				<?php
				settings_fields( 'lipishilpo_settings' );

				// Hook to render Pro cards if Pro is active
				do_action( 'lipishilpo_render_admin_pro_cards' );
				?>

				<!-- Shortcode & Integration Card -->
				<?php self::render_free_section(); ?>

				<!-- Data Retention / Uninstall Options Card -->
				<?php self::render_data_retention_section(); ?>

				<div class="lipishilpo-submit-area">
					<button type="submit" class="lipishilpo-save-btn">
						<span>💾</span> <?php esc_html_e( 'Save Settings', 'lipishilpo' ); ?>
					</button>
				</div>
			</form>

			<?php if ( ! $pro_installed ) : ?>
				<!-- Upgrade Card -->
				<div class="lipishilpo-card-section" style="border-left: 4px solid #10b981; margin-top: 24px;">
					<div class="lipishilpo-card-header">
						<div class="lipishilpo-card-header-icon" style="background: #ecfdf5; color: #059669; border-color: #a7f3d0;">💎</div>
						<h2 class="lipishilpo-card-title"><?php esc_html_e( 'Unlock Premium Features with Lipishilpo Pro', 'lipishilpo' ); ?></h2>
					</div>
					<p class="lipishilpo-card-subtitle">
						<?php esc_html_e( 'Enhance your manuscript studio with professional literary and publishing superpowers:', 'lipishilpo' ); ?>
					</p>
					
					<ul style="list-style: disc; padding-left: 24px; line-height: 1.8; color: #334155; font-size: 14px;">
						<li><strong><?php esc_html_e( 'Universal AI Editorial (Gemini, Claude, OpenAI, OpenRouter):', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Rhythm, sentence cadence, and style suggestions for Bengali & English manuscripts.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'Whole-Book Continuity & Character Tracker:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Automatic timeline discrepancy, plot-hole, and character trait tracking.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'Audio Proofreader (TTS):', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Natural voice reading with real-time sentence-by-sentence focus cursor.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'Book Publication Studio:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Print-ready PDF, editable DOCX, and reflowable EPUB export with Bengali font embedding.', 'lipishilpo' ); ?></li>
					</ul>

					<p style="margin-top: 20px;">
						<a href="https://lipishilpo.com/pro" target="_blank" class="lipishilpo-save-btn" style="text-decoration: none !important;">
							<?php esc_html_e( 'Upgrade to Lipishilpo Pro →', 'lipishilpo' ); ?>
						</a>
					</p>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	public static function add_privacy_policy_content() {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$content = sprintf(
			'<h2>%s</h2><p>%s</p><h3>%s</h3><p>%s</p><h3>%s</h3><p>%s</p>',
			esc_html__( 'Lipishilpo Writing Studio Data & Privacy', 'lipishilpo' ),
			esc_html__( 'Lipishilpo stores manuscript drafts, chapter contents, character codex profiles, personal dictionary words, and writing streak statistics exclusively in the local WordPress database. Manuscript drafts are private and accessible only by their creator.', 'lipishilpo' ),
			esc_html__( 'Third-Party Services & AI Processing', 'lipishilpo' ),
			esc_html__( 'In the standard Free version, Lipishilpo processes all text analysis and rule-based proofreading locally within the browser with zero external API calls. When the Lipishilpo Pro addon is activated, authors can optionally use AI editorial features (OpenAI, Google Gemini, Anthropic Claude). In such cases, only the specifically selected text or chapter is transmitted to the configured AI provider under the user-supplied API credentials.', 'lipishilpo' ),
			esc_html__( 'Data Retention & Deletion', 'lipishilpo' ),
			esc_html__( 'When an author deletes a manuscript project, all related chapters, snapshots, and editorial comments are permanently purged from the database. When the plugin is uninstalled, data is preserved by default unless the administrator explicitly opts in to remove all manuscript tables and options on uninstall.', 'lipishilpo' )
		);

		wp_add_privacy_policy_content( 'Lipishilpo', wp_kses_post( $content ) );
	}

	public static function render_free_section() {
		?>
		<div class="lipishilpo-card-section" style="margin-top: 15px;">
			<div class="lipishilpo-card-header">
				<div class="lipishilpo-card-header-icon" style="background: #fdf4ff; color: #a855f7; border-color: #f5d0fe;">📌</div>
				<div>
					<h2 class="lipishilpo-card-title"><?php esc_html_e( 'WordPress Shortcode & Embed Integration', 'lipishilpo' ); ?></h2>
					<span class="lipishilpo-card-tag"><?php esc_html_e( 'Frontend Embed & Access Control', 'lipishilpo' ); ?></span>
				</div>
			</div>
			<p class="lipishilpo-card-subtitle">
				<?php esc_html_e( 'Display the complete writing studio on any page or post by adding this shortcode:', 'lipishilpo' ); ?>
			</p>

			<div class="lipishilpo-shortcode-box">
				<span class="lipishilpo-shortcode-code">[lipishilpo]</span>
				<button type="button" class="lipishilpo-copy-btn" onclick="lipishilpoCopyShortcode(this)">
					<span>📋</span> <?php esc_html_e( 'Copy Shortcode', 'lipishilpo' ); ?>
				</button>
			</div>

			<p class="description" style="margin-top: 8px;">
				💡 <strong><?php esc_html_e( 'Tip:', 'lipishilpo' ); ?></strong>
				<?php esc_html_e( 'Set your shortcode page template to Full-Width or Canvas/Blank for the best distraction-free experience. For security and privacy, only logged-in users with edit permissions can view and write in the studio.', 'lipishilpo' ); ?>
			</p>
		</div>
		<?php
	}

	public static function render_data_retention_section() {
		$delete_on_uninstall = get_option( 'lipishilpo_delete_data_on_uninstall', '0' );
		?>
		<div class="lipishilpo-card-section" style="margin-top: 15px;">
			<div class="lipishilpo-card-header">
				<div class="lipishilpo-card-header-icon" style="background: #fef2f2; color: #ef4444; border-color: #fecaca;">🗑️</div>
				<div>
					<h2 class="lipishilpo-card-title"><?php esc_html_e( 'Data Retention & Uninstall Settings', 'lipishilpo' ); ?></h2>
					<span class="lipishilpo-card-tag" style="background: #fee2e2; color: #991b1b;"><?php esc_html_e( 'Database Safety', 'lipishilpo' ); ?></span>
				</div>
			</div>
			<p class="lipishilpo-card-subtitle">
				<?php esc_html_e( 'Choose whether plugin data and manuscripts should be completely wiped when uninstalling the plugin:', 'lipishilpo' ); ?>
			</p>

			<div style="margin-top: 12px;">
				<label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 14px; color: #1e293b;">
					<input type="checkbox" name="lipishilpo_delete_data_on_uninstall" value="1" <?php checked( '1', $delete_on_uninstall ); ?> style="margin-top: 3px;" />
					<span>
						<strong><?php esc_html_e( 'Erase all manuscripts and plugin data upon uninstall', 'lipishilpo' ); ?></strong>
						<br />
						<span style="font-size: 12px; color: #64748b;">
							<?php esc_html_e( 'By default, your literary manuscripts are kept safely in the database even if the plugin is uninstalled. Check this box ONLY if you wish to permanently purge all manuscripts, snapshots, and options when Lipishilpo is deleted.', 'lipishilpo' ); ?>
						</span>
					</span>
				</label>
			</div>
		</div>
		<?php
	}
}
