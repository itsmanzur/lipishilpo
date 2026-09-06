<?php
/**
 * Admin Settings Page — Lipishilpo (Free)
 *
 * Provides general info and user guide in the Free version.
 * When Lipishilpo Pro is active, Pro settings (OpenAI Key, License) are attached via hooks.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Admin {

	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function register_settings() {
		// Free section
		add_settings_section(
			'lipishilpo_free_section',
			__( 'General Information & Usage Guide', 'lipishilpo' ),
			array( __CLASS__, 'render_free_section' ),
			'lipishilpo-settings'
		);

		// Hook for Pro addon settings
		do_action( 'lipishilpo_register_admin_settings' );
	}

	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Permission denied.', 'lipishilpo' ) );
		}

		$is_pro         = lipishilpo_is_pro();
		$pro_installed  = defined( 'LIPISHILPO_PRO_VERSION' );
		?>
		<div class="wrap lipishilpo-settings-wrap">
			<h1>
				<span style="font-family: serif; color: #20644f;">✍</span>
				<?php esc_html_e( 'Lipishilpo Settings & Documentation', 'lipishilpo' ); ?>
			</h1>

			<?php if ( $is_pro ) : ?>
				<div class="notice notice-success inline" style="margin-top: 15px;">
					<p>✅ <strong><?php esc_html_e( 'Lipishilpo Pro is active.', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'AI editorial analysis, character tracking, and advanced book formatting are unlocked.', 'lipishilpo' ); ?></p>
				</div>
			<?php elseif ( $pro_installed ) : ?>
				<div class="notice notice-warning inline" style="margin-top: 15px;">
					<p><strong><?php esc_html_e( 'Lipishilpo Pro is installed but not licensed.', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Enter a license key below to unlock Pro features.', 'lipishilpo' ); ?></p>
				</div>
			<?php else : ?>
				<div class="notice notice-info inline" style="margin-top: 15px; border-left-color: #20644f;">
					<p>
						💡 <strong><?php esc_html_e( 'Lipishilpo (Free Version) is active.', 'lipishilpo' ); ?></strong>
						<?php esc_html_e( 'Rule-based proofreading and manuscript management are always free to use.', 'lipishilpo' ); ?>
					</p>
				</div>
			<?php endif; ?>

			<form method="post" action="options.php">
				<?php
				settings_fields( 'lipishilpo_settings' );
				do_settings_sections( 'lipishilpo-settings' );

				if ( $pro_installed ) {
					submit_button( __( 'Save Settings', 'lipishilpo' ) );
				}
				?>
			</form>

			<?php if ( ! $is_pro ) : ?>
				<div class="card" style="max-width: 800px; margin-top: 20px; padding: 20px 24px; border-left: 4px solid #20644f;">
					<h2 style="margin-top: 0; color: #20644f;"><?php esc_html_e( '💎 What you get in Lipishilpo Pro', 'lipishilpo' ); ?></h2>
					<p><?php esc_html_e( 'Install and activate the Lipishilpo Pro addon to unlock these advanced features:', 'lipishilpo' ); ?></p>
					
					<ul style="list-style: disc; padding-left: 24px; line-height: 1.8;">
						<li><strong><?php esc_html_e( 'AI Editorial Suggestions:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Contextual Bengali/English phrasing refinements, clarity improvements, and style polish.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'Story & Character Tracking:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Detect character age conflicts, narrative inconsistencies, and unresolved plot points.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'AI Reader Simulations:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Simulate reader engagement, pace drops, and confusing passages before publishing.', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'Book Publication Formatting:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'Export ready-to-publish DOCX, PDF, and EPUB files with embedded Bengali fonts and table of contents.', 'lipishilpo' ); ?></li>
					</ul>

					<p style="margin-top: 15px;">
						<a href="https://lipishilpo.com/pro" target="_blank" class="button button-primary" style="background: #20644f; border-color: #20644f;">
							<?php esc_html_e( 'Get Lipishilpo Pro →', 'lipishilpo' ); ?>
						</a>
					</p>
				</div>
			<?php endif; ?>

			<?php
			// Pro plugin bottom action
			do_action( 'lipishilpo_admin_settings_bottom' );
			?>
		</div>
		<?php
	}

	public static function render_free_section() {
		?>
		<div style="background: #fff; padding: 16px; border: 1px solid #ccd0d4; border-radius: 4px; max-width: 800px;">
			<p><strong><?php esc_html_e( 'Shortcode Usage:', 'lipishilpo' ); ?></strong></p>
			<p><?php esc_html_e( 'Place the following shortcode on any post or page to render the complete studio editor:', 'lipishilpo' ); ?></p>
			<code>[lipishilpo]</code>
			<p class="description" style="margin-top: 8px;">
				<?php esc_html_e( 'For security and privacy, only logged-in users can view, create, and edit their manuscripts.', 'lipishilpo' ); ?>
			</p>
		</div>
		<?php
	}
}
