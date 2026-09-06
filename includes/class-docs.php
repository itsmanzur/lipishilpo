<?php
/**
 * Interactive User-friendly Documentation & Guide — Lipishilpo
 *
 * Provides a bilingual (English & Bengali) interactive documentation portal
 * designed for non-technical writers, editors, bloggers, and publishers.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Docs {

	public static function init() {
		// Loaded by main plugin
	}

	public static function render_docs_page() {
		if ( ! current_user_can( 'read' ) ) {
			wp_die( esc_html__( 'Permission denied.', 'lipishilpo' ) );
		}

		$is_pro = lipishilpo_is_pro();
		?>
		<div class="wrap lipishilpo-docs-wrapper">
			<style>
				.lipishilpo-docs-wrapper {
					max-width: 1100px;
					margin: 20px auto;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif;
					color: #263e38;
				}
				.docs-header {
					background: linear-gradient(135deg, #1b5341 0%, #20644f 100%);
					color: #ffffff;
					padding: 32px 36px;
					border-radius: 12px;
					box-shadow: 0 4px 20px rgba(32, 100, 79, 0.15);
					display: flex;
					align-items: center;
					justify-content: space-between;
					flex-wrap: wrap;
					gap: 20px;
					margin-bottom: 24px;
				}
				.docs-header-content h1 {
					color: #ffffff;
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 8px 0;
					display: flex;
					align-items: center;
					gap: 12px;
				}
				.docs-header-content p {
					color: #d2ede2;
					font-size: 15px;
					margin: 0;
					max-width: 650px;
					line-height: 1.5;
				}
				.docs-lang-toggle {
					display: inline-flex;
					background: rgba(255, 255, 255, 0.18);
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: 30px;
					padding: 4px;
					cursor: pointer;
				}
				.docs-lang-toggle button {
					background: transparent;
					border: none;
					color: #ffffff;
					padding: 6px 16px;
					font-size: 13px;
					font-weight: 600;
					border-radius: 20px;
					cursor: pointer;
					transition: all 0.2s ease;
				}
				.docs-lang-toggle button.active {
					background: #ffffff;
					color: #20644f;
					box-shadow: 0 2px 6px rgba(0,0,0,0.12);
				}
				.docs-layout {
					display: grid;
					grid-template-columns: 260px 1fr;
					gap: 24px;
				}
				@media (max-width: 850px) {
					.docs-layout {
						grid-template-columns: 1fr;
					}
				}
				.docs-nav {
					background: #ffffff;
					border: 1px solid #dbe5d8;
					border-radius: 10px;
					padding: 16px;
					position: sticky;
					top: 40px;
					height: fit-content;
					box-shadow: 0 2px 8px rgba(0,0,0,0.03);
				}
				.docs-nav-title {
					font-size: 11px;
					text-transform: uppercase;
					letter-spacing: 0.08em;
					color: #698375;
					font-weight: 700;
					margin-bottom: 12px;
					padding: 0 8px;
				}
				.docs-nav-btn {
					display: flex;
					align-items: center;
					gap: 10px;
					width: 100%;
					text-align: left;
					background: transparent;
					border: none;
					padding: 10px 12px;
					font-size: 14px;
					color: #3b594b;
					border-radius: 6px;
					cursor: pointer;
					margin-bottom: 4px;
					transition: all 0.15s ease;
					font-weight: 500;
				}
				.docs-nav-btn:hover {
					background: #f0f6ec;
					color: #20644f;
				}
				.docs-nav-btn.active {
					background: #e6f0e3;
					color: #20644f;
					font-weight: 600;
				}
				.docs-card {
					background: #ffffff;
					border: 1px solid #dbe5d8;
					border-radius: 10px;
					padding: 28px 32px;
					margin-bottom: 24px;
					box-shadow: 0 2px 10px rgba(0,0,0,0.03);
				}
				.docs-card h2 {
					font-size: 20px;
					color: #1a4234;
					margin: 0 0 16px 0;
					display: flex;
					align-items: center;
					gap: 10px;
					border-bottom: 2px solid #eef3eb;
					padding-bottom: 12px;
				}
				.docs-card p {
					font-size: 14.5px;
					line-height: 1.7;
					color: #3f5e50;
					margin: 0 0 16px 0;
				}
				.docs-feature-box {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
					gap: 16px;
					margin: 20px 0;
				}
				.feature-mini-card {
					background: #f7faf5;
					border: 1px solid #e0ebd9;
					border-radius: 8px;
					padding: 16px;
				}
				.feature-mini-card h3 {
					font-size: 15px;
					color: #20644f;
					margin: 0 0 6px 0;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.feature-mini-card p {
					font-size: 13px;
					color: #4b6657;
					margin: 0;
					line-height: 1.5;
				}
				.step-list {
					margin: 16px 0;
					padding-left: 0;
					list-style: none;
				}
				.step-item {
					display: flex;
					gap: 14px;
					margin-bottom: 16px;
				}
				.step-number {
					flex-shrink: 0;
					width: 28px;
					height: 28px;
					background: #20644f;
					color: #ffffff;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: 700;
					font-size: 13px;
				}
				.step-text h4 {
					margin: 0 0 4px 0;
					font-size: 15px;
					color: #1e4537;
				}
				.step-text p {
					margin: 0;
					font-size: 13.5px;
					color: #4b6b5b;
				}
				.playground-box {
					background: #fdfefe;
					border: 2px dashed #b9d4c2;
					border-radius: 8px;
					padding: 20px;
					margin: 20px 0;
				}
				.playground-box textarea {
					width: 100%;
					min-height: 70px;
					padding: 10px;
					border: 1px solid #ccd8c7;
					border-radius: 6px;
					font-size: 14px;
					outline: none;
					box-sizing: border-box;
					font-family: inherit;
				}
				.playground-actions {
					display: flex;
					gap: 10px;
					align-items: center;
					margin-top: 10px;
					flex-wrap: wrap;
				}
				.playground-result {
					margin-top: 12px;
					padding: 12px;
					background: #eaf3e7;
					border-radius: 6px;
					font-size: 13.5px;
					color: #20644f;
					display: none;
				}
				.copy-shortcode-box {
					background: #f0f6ec;
					border: 1px solid #cfe0cb;
					border-radius: 6px;
					padding: 12px 16px;
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin: 16px 0;
				}
				.copy-shortcode-box code {
					font-size: 15px;
					font-weight: 600;
					color: #1e5240;
					background: #ffffff;
					padding: 4px 10px;
					border-radius: 4px;
					border: 1px solid #d4e0cf;
				}
				.faq-item {
					border-bottom: 1px solid #e6eee3;
					padding: 14px 0;
				}
				.faq-item:last-child {
					border-bottom: none;
				}
				.faq-question {
					font-size: 15px;
					font-weight: 600;
					color: #1e4537;
					cursor: pointer;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				.faq-answer {
					font-size: 14px;
					color: #4a695a;
					margin-top: 8px;
					line-height: 1.6;
					display: none;
				}
				.faq-item.open .faq-answer {
					display: block;
				}
			</style>

			<!-- ── Header ── -->
			<div class="docs-header">
				<div class="docs-header-content">
					<h1>
						<span>✍</span>
						<span data-en="Lipishilpo — User Guide & Documentation" data-bn="লিপিশিল্প — ব্যবহার নির্দেশিকা ও সহায়িকা">
							Lipishilpo — User Guide & Documentation
						</span>
					</h1>
					<p data-en="A gentle, non-technical walkthrough on how to write, organize, proofread, and publish your manuscripts with Lipishilpo."
					   data-bn="খাতা-কলমের মতোই সহজ—কীভাবে পাণ্ডুলিপি তৈরি করবেন, প্রুফরিডিং করবেন এবং বই ফরম্যাটিং করবেন তার পূর্ণাঙ্গ সহজ সহায়িকা।">
						A gentle, non-technical walkthrough on how to write, organize, proofread, and publish your manuscripts with Lipishilpo.
					</p>
				</div>

				<div class="docs-lang-toggle">
					<button id="doc-btn-en" class="active" onclick="switchDocLang('en')">English</button>
					<button id="doc-btn-bn" onclick="switchDocLang('bn')">বাংলা</button>
				</div>
			</div>

			<!-- ── Main Layout ── -->
			<div class="docs-layout">
				<!-- Sidebar Nav -->
				<aside class="docs-nav">
					<div class="docs-nav-title" data-en="Table of Contents" data-bn="বিষয়বস্তু">Table of Contents</div>
					<button class="docs-nav-btn active" onclick="scrollToSection('sec-intro')">
						🌟 <span data-en="1. What is Lipishilpo?" data-bn="১. লিপিশিল্প কী ও কেন?">1. What is Lipishilpo?</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-quickstart')">
						🚀 <span data-en="2. 3-Minute Quickstart" data-bn="২. ৩ মিনিটে দ্রুত শুরু">2. 3-Minute Quickstart</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-proofreading')">
						🔍 <span data-en="3. Proofreading Guide" data-bn="৩. বানান ও প্রুফরিডিং">3. Proofreading Guide</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-ai')">
						🤖 <span data-en="4. AI Assistant (Pro)" data-bn="৪. AI সম্পাদনা (Pro)">4. AI Assistant (Pro)</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-export')">
						📖 <span data-en="5. Export & Publishing" data-bn="৫. বই প্রকাশনা ও এক্সপোর্ট">5. Export & Publishing</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-shortcuts')">
						⚡ <span data-en="6. Shortcuts & Tips" data-bn="৬. শর্টকাট ও প্রো-টিপস">6. Shortcuts & Tips</span>
					</button>
					<button class="docs-nav-btn" onclick="scrollToSection('sec-faq')">
						❓ <span data-en="7. Common Questions" data-bn="৭. সাধারণ প্রশ্নোত্তর">7. Common Questions</span>
					</button>
				</aside>

				<!-- Content Column -->
				<main class="docs-content">

					<!-- Section 1: Intro -->
					<section id="sec-intro" class="docs-card">
						<h2>
							<span>🌟</span>
							<span data-en="1. What is Lipishilpo?" data-bn="১. লিপিশিল্প কী ও কাদের জন্য?">1. What is Lipishilpo?</span>
						</h2>
						
						<p data-en="<strong>Lipishilpo</strong> (লিপিশিল্প) is a dedicated manuscript writing and editorial studio built directly into WordPress. It is crafted specifically for authors, bloggers, journalists, translators, and creative writers who want a clean, distraction-free environment to develop first drafts into publication-ready books and articles."
						   data-bn="<strong>লিপিশিল্প</strong> হলো ওয়ার্ডপ্রেসের ভেতরেই লেখকদের নিজস্ব একটি ডিজিটাল কর্মক্ষেত্র বা পাণ্ডুলিপি স্টুডিও। গল্পকার, ঔপন্যাসিক, প্রাবন্ধিক, ব্লগার ও সাংবাদিকদের জন্য এটি খাতা-কলমের মতোই সহজ, কিন্তু এতে রয়েছে আধুনিক প্রুফরিডিং ও বই তৈরির স্মার্ট সুবিধা।">
							<strong>Lipishilpo</strong> (লিপিশিল্প) is a dedicated manuscript writing and editorial studio built directly into WordPress.
						</p>

						<div class="docs-feature-box">
							<div class="feature-mini-card">
								<h3>✍️ <span data-en="Chapter Studio" data-bn="অধ্যায় ব্যবস্থাপনা">Chapter Studio</span></h3>
								<p data-en="Write books and series split into organized chapters with auto-save and reordering."
								   data-bn="বই বা গল্পকে অধ্যায়ে ভাগ করে সাজিয়ে লিখুন। প্রতিটি পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।">
									Write books and series split into organized chapters with auto-save.
								</p>
							</div>
							<div class="feature-mini-card">
								<h3>🔍 <span data-en="Bangla Academy Proofing" data-bn="বাংলা একাডেমি বানানরীতি">Bangla Academy Proofing</span></h3>
								<p data-en="Rule-based spelling, grammar, and punctuation checker tuned for standard Bengali & English."
								   data-bn="বাংলা একাডেমির প্রমিত বানানরীতি ও ব্যাকরণ অনুযায়ী এক ক্লিকে লেখা যাচাই।">
									Rule-based spelling and grammar checker tuned for standard Bengali & English.
								</p>
							</div>
							<div class="feature-mini-card">
								<h3>📖 <span data-en="Instant Book Export" data-bn="বই ফরম্যাটিং">Instant Book Export</span></h3>
								<p data-en="Export with title page, table of contents and embedded Bengali fonts to DOCX, PDF, and EPUB."
								   data-bn="প্রচ্ছদ, সূচিপত্র ও ফন্টসহ সরাসরি DOCX, PDF, EPUB ও TXT ফাইলে রূপান্তর।">
									Export with title page and table of contents to PDF, DOCX, and EPUB.
								</p>
							</div>
							<div class="feature-mini-card">
								<h3>🌐 <span data-en="Bilingual & Extensible" data-bn="দ্বিভাষিক ইন্টারফেস">Bilingual & Extensible</span></h3>
								<p data-en="Switch between English and Bengali with a single click at any time."
								   data-bn="যেকোনো সময় এক ক্লিকে ইংরেজি এবং বাংলায় ইন্টারফেস বদলানোর সুবিধা।">
									Switch between English and Bengali with a single click.
								</p>
							</div>
						</div>
					</section>

					<!-- Section 2: Quickstart -->
					<section id="sec-quickstart" class="docs-card">
						<h2>
							<span>🚀</span>
							<span data-en="2. 3-Minute Quickstart Guide" data-bn="২. ৩ মিনিটে লেখা শুরুর সহজ ধাপ">2. 3-Minute Quickstart Guide</span>
						</h2>

						<p data-en="You do not need any coding or technical knowledge to use Lipishilpo. Follow these 3 simple steps:"
						   data-bn="লিপিশিল্প ব্যবহার করতে কোনো কারিগরি জ্ঞানের প্রয়োজন নেই। মাত্র ৩টি ধাপে আপনি আপনার লেখা শুরু করতে পারেন:">
							Follow these 3 simple steps:
						</p>

						<div class="step-list">
							<div class="step-item">
								<div class="step-number">1</div>
								<div class="step-text">
									<h4 data-en="Open the Studio" data-bn="স্টুডিও এডিটর খুলুন">Open the Studio</h4>
									<p data-en="Click on <strong>Lipishilpo</strong> in your WordPress admin menu, or visit any page where the shortcode is added."
									   data-bn="ওয়ার্ডপ্রেস ড্যাশবোর্ডের বামপাশের <strong>লিপিশিল্প</strong> মেনুতে ক্লিক করুন।">
										Click on Lipishilpo in your WordPress admin menu.
									</p>
								</div>
							</div>

							<div class="step-item">
								<div class="step-number">2</div>
								<div class="step-text">
									<h4 data-en="Create a Project" data-bn="নতুন প্রজেক্ট বা বই শুরু করুন">Create a Project</h4>
									<p data-en="Click <strong>'+ New Project'</strong>, enter your book/article title, choose the genre and language, then click Create."
									   data-bn="<strong>'+ নতুন প্রজেক্ট'</strong> বাটনে ক্লিক করে বইয়ের নাম, ধরন ও ভাষা বেছে নিন।">
										Click '+ New Project', enter your book/article title, and click Create.
									</p>
								</div>
							</div>

							<div class="step-item">
								<div class="step-number">3</div>
								<div class="step-text">
									<h4 data-en="Write & Check" data-bn="লিখুন এবং এক ক্লিকে যাচাই করুন">Write & Check</h4>
									<p data-en="Start drafting in the center paper canvas. Whenever you want a review, click <strong>'Check Text'</strong> in the right panel."
									   data-bn="মাঝের পৃষ্ঠায় নিশ্চিন্তে লিখতে থাকুন। যাচাই করতে ডানপাশের <strong>'লেখা পরীক্ষা করুন'</strong> বাটনে চাপ দিন।">
										Start drafting and click 'Check Text' to review spelling and style.
									</p>
								</div>
							</div>
						</div>

						<h3 style="font-size: 16px; margin-top: 20px;" data-en="Show Studio on Any Frontend Page" data-bn="ওয়েবসাইটের পেজে এডিটর দেখানোর নিয়ম">
							Show Studio on Any Frontend Page
						</h3>
						<p data-en="To embed the studio editor inside any WordPress page or post, paste this shortcode:"
						   data-bn="আপনার সাইটের যেকোনো পেজে সম্পূর্ণ এডিটর বসাতে এই শর্টকোডটি কপি করে পেজে পেস্ট করুন:">
							To embed the studio editor, paste this shortcode:
						</p>

						<div class="copy-shortcode-box">
							<code id="sc-code">[lipishilpo]</code>
							<button class="button button-secondary" onclick="copyShortcode()">
								📋 <span id="copy-btn-text" data-en="Copy Shortcode" data-bn="শর্টকোড কপি করুন">Copy Shortcode</span>
							</button>
						</div>
					</section>

					<!-- Section 3: Proofreading & Interactive Playground -->
					<section id="sec-proofreading" class="docs-card">
						<h2>
							<span>🔍</span>
							<span data-en="3. How Proofreading Works" data-bn="৩. প্রুফরিডিং কীভাবে কাজ করে?">3. How Proofreading Works</span>
						</h2>

						<p data-en="Lipishilpo includes a powerful built-in orthography engine adhering to <strong>Bangla Academy standard spelling rules</strong> alongside standard English typo checks. It flags issues and gives you complete control over accepting or ignoring each suggestion."
						   data-bn="লিপিশিল্পে রয়েছে বাংলা একাডেমি প্রমিত বানানরীতি সমৃদ্ধ একটি স্বয়ংক্রিয় প্রুফরিডার। এটি আপনার লেখার ভাব ও স্বর অক্ষুণ্ণ রেখে ভুল বানান ও যতিচিহ্ন শনাক্ত করে।">
							Lipishilpo includes a powerful built-in orthography engine adhering to Bangla Academy standard spelling rules.
						</p>

						<!-- Interactive Try It Yourself Box -->
						<div class="playground-box">
							<strong style="color: #20644f; font-size: 14px;" data-en="🧪 Interactive Practice Playground (Try it here):" data-bn="🧪 হাতে-কলমে প্রুফরিডিং টেস্ট করে দেখুন:">
								🧪 Interactive Practice Playground:
							</strong>
							<p style="font-size: 13px; margin: 4px 0 8px 0;" data-en="Type or click a sample sentence below, then click 'Run Test Check':" data-bn="নিচের বাক্সে কিছু লিখুন অথবা নমুনা বাটনে ক্লিক করে 'পরীক্ষা চালান' চাপুন:">
								Type or click a sample sentence below:
							</p>
							
							<textarea id="play-input">আমি সরকারী চাকরী করি এবং পরিস্কার পানি খাই ।</textarea>

							<div class="playground-actions">
								<button class="button button-primary" style="background: #20644f; border-color: #20644f;" onclick="runPlaygroundTest()">
									⚡ <span data-en="Run Test Check" data-bn="পরীক্ষা চালান">Run Test Check</span>
								</button>
								<button class="button button-secondary" onclick="setPlaygroundSample('bn')">
									📝 <span data-en="Sample Bengali Typo" data-bn="বাংলা নমুনা">Sample Bengali Typo</span>
								</button>
								<button class="button button-secondary" onclick="setPlaygroundSample('en')">
									📝 <span data-en="Sample English Typo" data-bn="ইংরেজি নমুনা">Sample English Typo</span>
								</button>
							</div>

							<div id="play-result" class="playground-result"></div>
						</div>

						<h3 style="font-size: 16px; margin-top: 20px;" data-en="Personal Ignore Dictionary (লেখকের নিজস্ব অভিধান)" data-bn="ব্যক্তিগত শব্দকোষ (Personal Dictionary)">
							Personal Ignore Dictionary
						</h3>
						<p data-en="When writing fiction or regional stories, you may use unique character names or dialects. Clicking the <strong>'X' (Ignore)</strong> button adds the word to your personal dictionary so Lipishilpo will never flag it again."
						   data-bn="গল্পে বিশেষ চরিত্রের নাম বা আঞ্চলিক শব্দ থাকলে পাশে থাকা <strong>'X' (উপেক্ষা)</strong> বাটনে চাপ দিলে শব্দটি আপনার ব্যক্তিগত শব্দকোষে জমা থাকবে এবং এতে আর কখনো ভুল ধরা হবে না।">
							Clicking 'Ignore' adds unique character names or dialects to your personal dictionary.
						</p>
					</section>

					<!-- Section 4: AI Assistant (Pro) -->
					<section id="sec-ai" class="docs-card">
						<h2>
							<span>🤖</span>
							<span data-en="4. AI Editorial & Continuity Analysis (Pro)" data-bn="৪. AI ভাষা ও ধারাবাহিকতা বিশ্লেষণ (Pro)">4. AI Editorial & Continuity Analysis (Pro)</span>
						</h2>

						<p data-en="With the <strong>Lipishilpo Pro</strong> add-on, you get access to a literary-grade OpenAI-powered assistant that understands both Bengali and English deeply."
						   data-bn="<strong>লিপিশিল্প Pro</strong> অ্যাডঅনের মাধ্যমে আপনি পাবেন আপনার নিজস্ব একজন সহকারী সাহিত্য সম্পাদক। এটি অধ্যায়ের পাশাপাশি পুরো বইয়ের অসঙ্গতি মিলিয়ে দেখতে পারে।">
							With the Lipishilpo Pro add-on, you get access to an OpenAI-powered literary assistant.
						</p>

						<div class="docs-feature-box">
							<div class="feature-mini-card">
								<h3>✨ <span data-en="Language & Style Mode" data-bn="ভাষা ও শৈলী মোড">Language & Style Mode</span></h3>
								<p data-en="Simplifies complex sentences, clarifies phrasing, and fixes subtle grammatical nuances without rewriting your story."
								   data-bn="জটিল বাক্যকে প্রাঞ্জল করে এবং লেখকের লেখার ভঙ্গি বজায় রেখে সাহিত্যিক পরামর্শ দেয়।">
									Simplifies complex sentences and clarifies phrasing.
								</p>
							</div>
							<div class="feature-mini-card">
								<h3>👥 <span data-en="Character & Age Tracker" data-bn="চরিত্র ও বয়সের ধারাবাহিকতা">Character & Age Tracker</span></h3>
								<p data-en="Scans across chapters to catch if a character's age, relationships, or eye color contradicts earlier scenes."
								   data-bn="কোনো চরিত্রের বয়স, চোখ বা সম্পর্কের তথ্য আগের অধ্যায়ের সাথে অমিল হলে সতর্ক করে।">
									Scans across chapters to catch character age or relationship discrepancies.
								</p>
							</div>
							<div class="feature-mini-card">
								<h3>🎯 <span data-en="Reader Simulation" data-bn="পাঠক প্রতিক্রিয়া">Reader Simulation</span></h3>
								<p data-en="Simulates hypothetical reader reactions, identifying where reader interest might drop or where a twist feels abrupt."
								   data-bn="একজন সাধারণ পাঠকের দৃষ্টিভঙ্গিতে লেখাটি কেমন অনুভূতি তৈরি করছে তা বিশ্লেষণ করে।">
									Simulates hypothetical reader reactions and pacing drops.
								</p>
							</div>
						</div>
					</section>

					<!-- Section 5: Export & Publishing -->
					<section id="sec-export" class="docs-card">
						<h2>
							<span>📖</span>
							<span data-en="5. Book Publication & Export Formats" data-bn="৫. বই প্রকাশনা ফরম্যাটিং ও এক্সপোর্ট">5. Book Publication & Export Formats</span>
						</h2>

						<p data-en="Turn your raw drafts into beautifully formatted books ready for print or digital distribution:"
						   data-bn="আপনার খসড়া লেখাকে সরাসরি প্রিন্ট বা অনলাইনে প্রকাশের উপযোগী বইয়ে রূপান্তর করুন:">
							Turn your raw drafts into beautifully formatted books:
						</p>

						<ul style="line-height: 1.8; color: #3f5e50;">
							<li><strong>📄 Plain Text (TXT) — Free:</strong> <span data-en="Clean backup of the entire book or individual chapters." data-bn="সম্পূর্ণ বই বা অধ্যায়ের নির্ভুল টেক্সট ব্যাকআপ।">Clean backup of the entire book.</span></li>
							<li><strong>📝 Markdown (.md) — Free:</strong> <span data-en="Ideal for importing into Notion, Obsidian, or publishing systems." data-bn="ওয়েব বা অন্যান্য নোটবুকে ব্যবহারের জন্য আদর্শ ফরম্যাট।">Ideal for importing into note systems.</span></li>
							<li><strong>📘 Word (DOCX) — Pro:</strong> <span data-en="Formatted with title page, page breaks, and custom margins for publishers." data-bn="প্রকাশকের জন্য প্রচ্ছদ, পৃষ্ঠা ব্রেক ও মার্জিনসহ তৈরি করা ওয়ার্ড ফাইল।">Formatted with title page and margins for publishers.</span></li>
							<li><strong>📕 PDF (A4 / A5) — Pro:</strong> <span data-en="Embedded Noto Serif Bengali fonts for crisp, flawless Bengali typography in print." data-bn="প্রিন্ট উপযোগী ঝকঝকে বাংলা ফন্টযুক্ত আন্তর্জাতিক মানের PDF।">Embedded Bengali fonts for print.</span></li>
							<li><strong>📱 EPUB eBook — Pro:</strong> <span data-en="Compatible with Apple Books, Kindle, and Google Play Books." data-bn="স্মার্টফোন ও ই-রিডারে পড়ার উপযোগী স্ট্যান্ডার্ড ই-বুক।">Compatible with mobile e-readers.</span></li>
						</ul>
					</section>

					<!-- Section 6: Shortcuts & Tips -->
					<section id="sec-shortcuts" class="docs-card">
						<h2>
							<span>⚡</span>
							<span data-en="6. Keyboard Shortcuts & Tips" data-bn="৬. কাজের গতি বাড়ানোর শর্টকাট ও টিপস">6. Keyboard Shortcuts & Tips</span>
						</h2>

						<table class="widefat striped" style="margin-top: 12px; border-radius: 6px; overflow: hidden;">
							<thead>
								<tr>
									<th style="font-weight: 700;" data-en="Shortcut" data-bn="শর্টকাট">Shortcut</th>
									<th style="font-weight: 700;" data-en="Action" data-bn="কাজ">Action</th>
									<th style="font-weight: 700;" data-en="Pro Tip" data-bn="উপকারী পরামর্শ">Pro Tip</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td><code>Ctrl + S</code> / <code>Cmd + S</code></td>
									<td data-en="Instant Server Save" data-bn="তাৎক্ষণিক সংরক্ষণ">Instant Server Save</td>
									<td data-en="Autosave runs automatically every 1.5s, but you can force save anytime." data-bn="স্বয়ংক্রিয় সংরক্ষণ থাকলেও তাৎক্ষণিক সেভ করতে এটি চাপুন।">Autosave runs every 1.5s.</td>
								</tr>
								<tr>
									<td><code>Ctrl + F</code> / <code>Cmd + F</code></td>
									<td data-en="Find & Replace Bar" data-bn="খুঁজুন ও প্রতিস্থাপন">Find & Replace Bar</td>
									<td data-en="Quickly change a character name or recurring word across the whole chapter." data-bn="অধ্যায়ের যেকোনো শব্দ এক ক্লিকে বদলে ফেলতে পারেন।">Quickly change recurring words.</td>
								</tr>
								<tr>
									<td><code>Ctrl + Z</code> / <code>Cmd + Z</code></td>
									<td data-en="Undo Last Change" data-bn="পরিবর্তন ফেরত আনুন">Undo Last Change</td>
									<td data-en="Restores previous text if you make an accidental edit." data-bn="ভুলবশত কিছু মুছে গেলে তা আগের অবস্থায় ফিরিয়ে আনে।">Restores previous text state.</td>
								</tr>
							</tbody>
						</table>
					</section>

					<!-- Section 7: FAQ -->
					<section id="sec-faq" class="docs-card">
						<h2>
							<span>❓</span>
							<span data-en="7. Frequently Asked Questions" data-bn="৭. সাধারণ প্রশ্নোত্তর">7. Frequently Asked Questions</span>
						</h2>

						<div class="faq-item">
							<div class="faq-question" onclick="toggleFaq(this)">
								<span data-en="Is my manuscript private and secure?" data-bn="আমার লেখা কি সম্পূর্ণ নিরাপদ ও গোপন থাকবে?">
									Is my manuscript private and secure?
								</span>
								<span>▼</span>
							</div>
							<div class="faq-answer" data-en="Yes, 100%. All your manuscripts, chapters, and drafts are stored securely in your WordPress database. Other users or guests cannot view your work unless you explicitly publish it."
							     data-bn="হ্যাঁ, শতভাগ। আপনার পাণ্ডুলিপির প্রতিটি অধ্যায় আপনার নিজস্ব ওয়ার্ডপ্রেস ডাটাবেজে সম্পূর্ণ নিরাপদে থাকে। আপনি নিজে প্রকাশ না করা পর্যন্ত অন্য কেউ এটি দেখতে পারবে না।">
								Yes, 100%. Your drafts are stored securely on your server.
							</div>
						</div>

						<div class="faq-item">
							<div class="faq-question" onclick="toggleFaq(this)">
								<span data-en="Can I write in English, Bengali, or both?" data-bn="আমি কি একই সাথে বাংলা ও ইংরেজি মিলিয়ে লিখতে পারি?">
									Can I write in English, Bengali, or both?
								</span>
								<span>▼</span>
							</div>
							<div class="faq-answer" data-en="Absolutely! Lipishilpo fully supports pure Bengali, pure English, and mixed multilingual manuscripts. Both the rule engine and font formatters handle mixed scripts seamlessly."
							     data-bn="অবশ্যই! লিপিশিল্প খাঁটি বাংলা, খাঁটি ইংরেজি এবং দুই ভাষার মিশ্রণ সম্পূর্ণ সমর্থন করে। ফন্ট ও প্রুফরিডার স্বয়ংক্রিয়ভাবে দুটি ভাষাই সুন্দরভাবে হ্যান্ডেল করে।">
								Absolutely! Lipishilpo supports pure Bengali, pure English, and mixed manuscripts.
							</div>
						</div>

						<div class="faq-item">
							<div class="faq-question" onclick="toggleFaq(this)">
								<span data-en="How do I get the Lipishilpo Pro add-on?" data-bn="লিপিশিল্প Pro অ্যাডঅন কীভাবে পাবো?">
									How do I get the Lipishilpo Pro add-on?
								</span>
								<span>▼</span>
							</div>
							<div class="faq-answer" data-en="Visit lipishilpo.com/pro to download the Lipishilpo Pro plugin. Once activated alongside the Free plugin, enter your license key and OpenAI key in Settings to unlock all AI and book export features."
							     data-bn="lipishilpo.com/pro থেকে Pro প্লাগিনটি ইনস্টল ও সক্রিয় করুন। এরপর 'লিপিশিল্প > সেটিংস' পেজে গিয়ে আপনার লাইসেন্স ও OpenAI API key যুক্ত করলেই সমস্ত প্রিমিয়াম ফিচার আনলক হয়ে যাবে।">
								Visit lipishilpo.com/pro to get the Pro plugin.
							</div>
						</div>
					</main>
				</div>
			</div>

			<!-- ── Interactive JS ── -->
			<script>
				function switchDocLang(lang) {
					document.getElementById('doc-btn-en').classList.toggle('active', lang === 'en');
					document.getElementById('doc-btn-bn').classList.toggle('active', lang === 'bn');

					document.querySelectorAll('[data-en]').forEach(el => {
						const text = lang === 'bn' ? el.getAttribute('data-bn') : el.getAttribute('data-en');
						if (text) {
							el.innerHTML = text;
						}
					});

					try {
						localStorage.setItem('lipishilpo_docs_lang', lang);
					} catch(e) {}
				}

				function scrollToSection(id) {
					const el = document.getElementById(id);
					if (el) {
						el.scrollIntoView({ behavior: 'smooth', block: 'start' });
						document.querySelectorAll('.docs-nav-btn').forEach(btn => btn.classList.remove('active'));
						event.currentTarget.classList.add('active');
					}
				}

				function toggleFaq(el) {
					const parent = el.parentElement;
					parent.classList.toggle('open');
				}

				function copyShortcode() {
					const code = document.getElementById('sc-code').innerText;
					navigator.clipboard.writeText(code).then(() => {
						const btnText = document.getElementById('copy-btn-text');
						const origEn = btnText.getAttribute('data-en');
						const origBn = btnText.getAttribute('data-bn');
						btnText.innerText = '✅ Copied!';
						setTimeout(() => {
							const curLang = document.getElementById('doc-btn-bn').classList.contains('active') ? 'bn' : 'en';
							btnText.innerText = curLang === 'bn' ? origBn : origEn;
						}, 2000);
					});
				}

				function setPlaygroundSample(lang) {
					const input = document.getElementById('play-input');
					if (lang === 'bn') {
						input.value = 'আমি সরকারী চাকরী করি এবং পরিস্কার পানি খাই ।';
					} else {
						input.value = 'teh book is recieve by someone untill tomorrow.';
					}
				}

				function runPlaygroundTest() {
					const val = document.getElementById('play-input').value;
					const resultEl = document.getElementById('play-result');
					const isBn = document.getElementById('doc-btn-bn').classList.contains('active');

					if (!val.trim()) {
						resultEl.style.display = 'block';
						resultEl.innerHTML = isBn ? '⚠️ অনুগ্রহ করে কিছু লিখুন।' : '⚠️ Please enter some text to test.';
						return;
					}

					let issues = [];
					if (val.includes('সরকারী')) issues.push(isBn ? '🔴 <strong>সরকারী</strong> ➔ <strong>সরকারি</strong> (বাংলা একাডেমি নিয়ম)' : '🔴 <strong>সরকারী</strong> ➔ <strong>সরকারি</strong> (Bangla Academy standard)');
					if (val.includes('চাকরী')) issues.push(isBn ? '🔴 <strong>চাকরী</strong> ➔ <strong>চাকরি</strong> (হ্রস্ব ই-কার)' : '🔴 <strong>চাকরী</strong> ➔ <strong>চাকরি</strong> (short i-kar)');
					if (val.includes('পরিস্কার')) issues.push(isBn ? '🔴 <strong>পরিস্কার</strong> ➔ <strong>পরিষ্কার</strong> (ষ-ত্ব বিধান)' : '🔴 <strong>পরিস্কার</strong> ➔ <strong>পরিষ্কার</strong> (Standard orthography)');
					if (val.includes(' ।')) issues.push(isBn ? '🔴 <strong>দাঁড়ির পূর্বে স্পেস</strong> দূর করুন' : '🔴 Remove space before Dāri (।)');
					if (val.includes('teh')) issues.push('🔴 <strong>teh</strong> ➔ <strong>the</strong> (Typo)');
					if (val.includes('recieve')) issues.push('🔴 <strong>recieve</strong> ➔ <strong>receive</strong> (Spelling)');
					if (val.includes('untill')) issues.push('🔴 <strong>untill</strong> ➔ <strong>until</strong> (Spelling)');

					resultEl.style.display = 'block';
					if (issues.length > 0) {
						resultEl.innerHTML = '<strong>' + (isBn ? 'পদ্ধতিগত ফলাফল (' + issues.length + 'টি বিষয়):' : 'Found ' + issues.length + ' issue(s):') + '</strong><br>' + issues.join('<br>');
					} else {
						resultEl.innerHTML = '✅ ' + (isBn ? 'কোনো ভুল পাওয়া যায়নি! লেখাটি চমৎকার ও প্রমিত।' : 'No issues found! Text looks clean.');
					}
				}

				// Restore saved language preference
				document.addEventListener('DOMContentLoaded', function() {
					try {
						const saved = localStorage.getItem('lipishilpo_docs_lang');
						if (saved === 'bn') switchDocLang('bn');
					} catch(e) {}
				});
			</script>
		</div>
		<?php
	}
}
