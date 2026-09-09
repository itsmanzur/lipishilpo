<?php
/**
 * Admin Settings Page — Lipishilpo (Free)
 *
 * Provides general info, shortcode guides, and premium dashboard styling.
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
	}

	public static function register_settings() {
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
					<h1><?php esc_html_e( 'লিপিশিল্প সেটিংস ও কনফিগারেশন', 'lipishilpo' ); ?></h1>
					<p>
						<?php esc_html_e( 'ইউনিভার্সাল AI প্রোভাইডার, শর্টকোড ইন্টিগ্রেশন এবং প্রো লাইসেন্স পরিচালনা করুন।', 'lipishilpo' ); ?>
					</p>
				</div>
				<div class="lipishilpo-hero-actions">
					<a href="<?php echo esc_url( $editor_url ); ?>" class="lipishilpo-hero-btn-primary">
						<span>✍</span> <?php esc_html_e( 'স্টুডিও খুলুন', 'lipishilpo' ); ?>
					</a>
					<a href="<?php echo esc_url( $docs_url ); ?>" class="lipishilpo-hero-btn-secondary">
						<span>📖</span> <?php esc_html_e( 'ইউজার গাইড', 'lipishilpo' ); ?>
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
								esc_html_e( 'Lipishilpo Pro সক্রিয় রয়েছে', 'lipishilpo' );
							} elseif ( $pro_installed ) {
								esc_html_e( 'Lipishilpo Pro ইনস্টল করা কিন্তু লাইসেন্স হয়নি', 'lipishilpo' );
							} else {
								esc_html_e( 'Lipishilpo (ফ্রি সংস্করণ) সক্রিয়', 'lipishilpo' );
							}
							?>
						</h3>
						<p class="lipishilpo-status-desc">
							<?php
							if ( $is_pro ) {
								esc_html_e( 'ইউনিভার্সাল AI এডিটিং, পুরো বইয়ের ধারাবাহিকতা এবং DOCX, PDF ও EPUB পাবলিকেশন ইঞ্জিন সক্রিয়।', 'lipishilpo' );
							} else {
								esc_html_e( 'বাংলা একাডেমির প্রমিত ব্যাকরণ পরীক্ষণ, পান্ডুলিপি সংগঠন ও অফলাইন স্টুডিও আজীবন ফ্রি।', 'lipishilpo' );
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

			<?php if ( $pro_installed ) : ?>
				<form method="post" action="options.php" id="lipishilpo_settings_form">
					<?php
					settings_fields( 'lipishilpo_settings' );
					
					// Hook to render Pro cards
					do_action( 'lipishilpo_render_admin_pro_cards' );
					?>

					<!-- Shortcode & Integration Card -->
					<?php self::render_free_section(); ?>

					<div class="lipishilpo-submit-area">
						<button type="submit" class="lipishilpo-save-btn">
							<span>💾</span> <?php esc_html_e( 'Save Settings (সংরক্ষণ করুন)', 'lipishilpo' ); ?>
						</button>
					</div>
				</form>
			<?php else : ?>
				<!-- Shortcode Card -->
				<?php self::render_free_section(); ?>

				<!-- Upgrade Card -->
				<div class="lipishilpo-card-section" style="border-left: 4px solid #10b981; margin-top: 24px;">
					<div class="lipishilpo-card-header">
						<div class="lipishilpo-card-header-icon" style="background: #ecfdf5; color: #059669; border-color: #a7f3d0;">💎</div>
						<h2 class="lipishilpo-card-title"><?php esc_html_e( 'লিপিশিল্প Pro-তে যা যা পাচ্ছেন', 'lipishilpo' ); ?></h2>
					</div>
					<p class="lipishilpo-card-subtitle">
						<?php esc_html_e( 'লিপিশিল্প Pro অ্যাড-অন ইনস্টল করে এই প্রিমিয়াম ফিচারগুলো আনলক করুন:', 'lipishilpo' ); ?>
					</p>
					
					<ul style="list-style: disc; padding-left: 24px; line-height: 1.8; color: #334155; font-size: 14px;">
						<li><strong><?php esc_html_e( 'ইউনিভার্সাল AI এডিটোরিয়াল (Gemini, Claude, OpenAI):', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'বাংলা ও ইংরেজি সাহিত্যের জন্য নির্ভুল ছন্দ, বাক্যগঠন ও শৈলীগত পরামর্শ।', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'সমগ্র বইয়ের ধারাবাহিকতা ও চরিত্র ট্র্যাকিং:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'চরিত্রের বয়স, সম্পর্ক, টাইমলাইন ও প্লটহোল স্বয়ংক্রিয়ভাবে শনাক্তকরণ।', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'অডিও প্রুফরিডার (TTS):', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'বাংলা ভয়েসে চ্যাপ্টার পাঠ এবং রিয়েলটাইম সেন্টেন্স ফোকাস কার্সার।', 'lipishilpo' ); ?></li>
						<li><strong><?php esc_html_e( 'বুক পাবলিকেশন স্টুডিও:', 'lipishilpo' ); ?></strong> <?php esc_html_e( 'বাংলা ফন্টসহ প্রিন্ট-রেডি PDF, DOCX এবং রিফ্লোয়েবল EPUB এক্সপোর্ট।', 'lipishilpo' ); ?></li>
					</ul>

					<p style="margin-top: 20px;">
						<a href="https://lipishilpo.com/pro" target="_blank" class="lipishilpo-save-btn" style="text-decoration: none !important;">
							<?php esc_html_e( 'Upgrade to Lipishilpo Pro →', 'lipishilpo' ); ?>
						</a>
					</p>
				</div>
			<?php endif; ?>
		</div>

		<script>
		function lipishilpoCopyShortcode(btn) {
			navigator.clipboard.writeText('[lipishilpo]').then(function() {
				const origText = btn.innerHTML;
				btn.classList.add('copied');
				btn.innerHTML = '<span>✓</span> ' + '<?php echo esc_js( __( 'কপি হয়েছে!', 'lipishilpo' ) ); ?>';
				setTimeout(function() {
					btn.classList.remove('copied');
					btn.innerHTML = origText;
				}, 2000);
			});
		}
		</script>
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
			esc_html__( 'When an author deletes a manuscript project, all related chapters, snapshots, and editorial comments are permanently purged from the database. When the plugin is uninstalled, all plugin post types, user metadata, and configuration options are completely erased.', 'lipishilpo' )
		);

		wp_add_privacy_policy_content( 'Lipishilpo', wp_kses_post( $content ) );
	}

	public static function render_free_section() {
		?>
		<div class="lipishilpo-card-section" style="margin-top: 15px;">
			<div class="lipishilpo-card-header">
				<div class="lipishilpo-card-header-icon" style="background: #fdf4ff; color: #a855f7; border-color: #f5d0fe;">📌</div>
				<div>
					<h2 class="lipishilpo-card-title"><?php esc_html_e( 'ওয়ার্ডপ্রেস শর্টকোড ও সাইট ইন্টিগ্রেশন', 'lipishilpo' ); ?></h2>
					<span class="lipishilpo-card-tag"><?php esc_html_e( 'Frontend Embed & Access Control', 'lipishilpo' ); ?></span>
				</div>
			</div>
			<p class="lipishilpo-card-subtitle">
				<?php esc_html_e( 'আপনার সাইটের যেকোনো পেজ বা পোস্টে নিচের শর্টকোডটি বসিয়ে সম্পূর্ণ পান্ডুলিপি স্টুডিও প্রদর্শন করতে পারেন:', 'lipishilpo' ); ?>
			</p>

			<div class="lipishilpo-shortcode-box">
				<span class="lipishilpo-shortcode-code">[lipishilpo]</span>
				<button type="button" class="lipishilpo-copy-btn" onclick="lipishilpoCopyShortcode(this)">
					<span>📋</span> <?php esc_html_e( 'কপি শর্টকোড', 'lipishilpo' ); ?>
				</button>
			</div>

			<p class="description" style="margin-top: 8px;">
				💡 <strong><?php esc_html_e( 'টিপস:', 'lipishilpo' ); ?></strong>
				<?php esc_html_e( 'শর্টকোডযুক্ত পেজটিকে ফুল-উইডথ (Full-Width / Blank Template) টেমপ্লেটে রাখলে লেখকরা সবচেয়ে স্বাচ্ছন্দ্যে লিখতে পারবেন। নিরাপত্তার স্বার্থে শুধুমাত্র লগইন করা ইউজাররা তাদের নিজস্ব পাণ্ডুলিপি দেখতে ও সম্পাদনা করতে পারবেন।', 'lipishilpo' ); ?>
			</p>
		</div>
		<?php
	}
}
