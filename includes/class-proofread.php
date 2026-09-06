<?php
/**
 * Proofread REST API — Lipishilpo (Free)
 *
 * Comprehensive rule-based Bengali & English orthography, grammar,
 * Sadhu-Cholit forms, Visarga conventions, and punctuation verification.
 *
 * Endpoint:
 *   POST /wp-json/lipishilpo/v1/proofread
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Lipishilpo_Proofread {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			LIPISHILPO_REST_NAMESPACE,
			'/proofread',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'proofread' ),
				'permission_callback' => array( 'Lipishilpo_Projects', 'require_login' ),
				'args'                => array(
					'text'     => array(
						'type'     => 'string',
						'required' => true,
					),
					'language' => array(
						'type'    => 'string',
						'default' => 'all',
					),
				),
			)
		);
	}

	private static function get_rules() {
		return array(
			// ── ১. ই-কার বনাম ঈ-কার ──────────────────────────
			array( 'from' => 'বিদেশী', 'to' => 'বিদেশি', 'why' => 'Bangla Academy standard: Foreign/modern words use short "ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'সরকারী', 'to' => 'সরকারি', 'why' => 'Bangla Academy standard: "সরকারি" uses short "ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'জরুরী', 'to' => 'জরুরি', 'why' => 'Standard spelling is "জরুরি"।', 'kind' => 'spelling' ),
			array( 'from' => 'শ্রেণী', 'to' => 'শ্রেণি', 'why' => 'Bangla Academy dictionary recommends "শ্রেণি"।', 'kind' => 'spelling' ),
			array( 'from' => 'পাখী', 'to' => 'পাখি', 'why' => 'Standard modern spelling is "পাখি"।', 'kind' => 'spelling' ),
			array( 'from' => 'বাড়ী', 'to' => 'বাড়ি', 'why' => 'Standard modern spelling is "বাড়ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'গাড়ী', 'to' => 'গাড়ি', 'why' => 'Standard modern spelling is "গাড়ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'দাবী', 'to' => 'দাবি', 'why' => 'Standard modern spelling is "দাবি"।', 'kind' => 'spelling' ),
			array( 'from' => 'তারীখ', 'to' => 'তারিখ', 'why' => 'Standard modern spelling is "তারিখ"।', 'kind' => 'spelling' ),
			array( 'from' => 'ছুটী', 'to' => 'ছুটি', 'why' => 'Standard modern spelling is "ছুটি"।', 'kind' => 'spelling' ),
			array( 'from' => 'শ্রদ্ধাঞ্জলী', 'to' => 'শ্রদ্ধাঞ্জলি', 'why' => '"অঞ্জলি" যুক্ত শব্দে সর্বদা হ্রস্ব "ি" হয়।', 'kind' => 'spelling' ),
			array( 'from' => 'গীতাঞ্জলী', 'to' => 'গীতাঞ্জলি', 'why' => 'Standard spelling is "গীতাঞ্জলি"।', 'kind' => 'spelling' ),
			array( 'from' => 'সূচীপত্র', 'to' => 'সূচিপত্র', 'why' => 'Standard spelling is "সূচিপত্র"।', 'kind' => 'spelling' ),
			array( 'from' => 'জানুয়ারী', 'to' => 'জানুয়ারি', 'why' => 'Foreign month names use short "ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'ফেব্রুয়ারী', 'to' => 'ফেব্রুয়ারি', 'why' => 'Foreign month names use short "ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'প্রতিযোগীতা', 'to' => 'প্রতিযোগিতা', 'why' => '"-তা" প্রত্যয় যুক্ত হলে হ্রস্ব "ি" হয়।', 'kind' => 'spelling' ),
			array( 'from' => 'সহযোগীতা', 'to' => 'সহযোগিতা', 'why' => '"-তা" প্রত্যয় যুক্ত হলে হ্রস্ব "ি" হয়।', 'kind' => 'spelling' ),
			array( 'from' => 'উপযোগীতা', 'to' => 'উপযোগিতা', 'why' => '"-তা" প্রত্যয়ে হ্রস্ব "ি" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'শাশুড়ী', 'to' => 'শাশুড়ি', 'why' => 'Standard modern spelling is "শাশুড়ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'নানী', 'to' => 'নানি', 'why' => 'Family relations use short "ি"।', 'kind' => 'spelling' ),
			array( 'from' => 'দাদী', 'to' => 'দাদি', 'why' => 'Family relations use short "ি"।', 'kind' => 'spelling' ),

			// ── ২. উ-কার বনাম ঊ-কার ────────────────────────
			array( 'from' => 'দূরবস্থা', 'to' => 'দুরবস্থা', 'why' => 'Correct sandhi form is "দুরবস্থা"।', 'kind' => 'spelling' ),
			array( 'from' => 'দূরন্ত', 'to' => 'দুরন্ত', 'why' => 'Standard spelling is "দুরন্ত"।', 'kind' => 'spelling' ),
			array( 'from' => 'দূর্নীতি', 'to' => 'দুর্নীতি', 'why' => 'Standard spelling is "দুর্নীতি"।', 'kind' => 'spelling' ),
			array( 'from' => 'দূর্ঘটনা', 'to' => 'দুর্ঘটনা', 'why' => 'Standard spelling is "দুর্ঘটনা"।', 'kind' => 'spelling' ),
			array( 'from' => 'দূর্যোগ', 'to' => 'দুর্যোগ', 'why' => 'Standard spelling is "দুর্যোগ"।', 'kind' => 'spelling' ),
			array( 'from' => 'ভূক্তভোগী', 'to' => 'ভুক্তভোগী', 'why' => 'Standard spelling is "ভুক্তভোগী"।', 'kind' => 'spelling' ),
			array( 'from' => 'মুহুর্ত', 'to' => 'মুহূর্ত', 'why' => 'Standard spelling is "মুহূর্ত"।', 'kind' => 'spelling' ),
			array( 'from' => 'অনূবাদ', 'to' => 'অনুবাদ', 'why' => 'Standard form is "অনুবাদ"।', 'kind' => 'spelling' ),
			array( 'from' => 'অনুদিত', 'to' => 'অনূদিত', 'why' => 'Past participle form is "অনূদিত"।', 'kind' => 'spelling' ),

			// ── ৩. ণ-ত্ব ও ষ-ত্ব বিধান / যুক্তবর্ণ ──────────
			array( 'from' => 'পরিস্কার', 'to' => 'পরিষ্কার', 'why' => 'Standard orthography uses মূর্ধন্য "ষ"।', 'kind' => 'spelling' ),
			array( 'from' => 'আবিস্কার', 'to' => 'আবিষ্কার', 'why' => 'Standard orthography uses মূর্ধন্য "ষ"।', 'kind' => 'spelling' ),
			array( 'from' => 'পুরষ্কার', 'to' => 'পুরস্কার', 'why' => 'Standard orthography uses দন্ত্য "স"।', 'kind' => 'spelling' ),
			array( 'from' => 'তিরষ্কার', 'to' => 'তিরস্কার', 'why' => 'Standard orthography uses দন্ত্য "স"।', 'kind' => 'spelling' ),
			array( 'from' => 'নিস্তব্দতা', 'to' => 'নিস্তব্ধতা', 'why' => 'Standard conjunct is "ব্ধ"।', 'kind' => 'spelling' ),
			array( 'from' => 'আশ্চর্য্য', 'to' => 'আশ্চর্য', 'why' => 'Bangla Academy standard: double "য" is dropped।', 'kind' => 'spelling' ),
			array( 'from' => 'আকাংখা', 'to' => 'আকাঙ্ক্ষা', 'why' => 'Standard spelling is "আকাঙ্ক্ষা"।', 'kind' => 'spelling' ),
			array( 'from' => 'সান্তনা', 'to' => 'সান্ত্বনা', 'why' => 'Standard spelling is "সান্ত্বনা"।', 'kind' => 'spelling' ),
			array( 'from' => 'উচ্ছাস', 'to' => 'উচ্ছ্বাস', 'why' => 'Standard spelling is "উচ্ছ্বাস"।', 'kind' => 'spelling' ),
			array( 'from' => 'উজ্জল', 'to' => 'উজ্জ্বল', 'why' => 'Standard spelling is "উজ্জ্বল"।', 'kind' => 'spelling' ),
			array( 'from' => 'শশুর', 'to' => 'শ্বশুর', 'why' => 'Standard spelling is "শ্বশুর"।', 'kind' => 'spelling' ),
			array( 'from' => 'দন্ডবিধি', 'to' => 'দণ্ডবিধি', 'why' => 'In tatsama words, "ড" takes মূর্ধন্য "ণ"।', 'kind' => 'spelling' ),
			array( 'from' => 'ধন্নবাদ', 'to' => 'ধন্যবাদ', 'why' => 'Standard spelling is "ধন্যবাদ"।', 'kind' => 'spelling' ),
			array( 'from' => 'মনযোগ', 'to' => 'মনোযোগ', 'why' => 'Sandhi form is "মনোযোগ"।', 'kind' => 'spelling' ),
			array( 'from' => 'ইতোপূর্বে', 'to' => 'ইতঃপূর্বে', 'why' => 'Correct sandhi form is "ইতঃপূর্বে"।', 'kind' => 'spelling' ),
			array( 'from' => 'আকষ্মিক', 'to' => 'আকস্মিক', 'why' => 'Standard spelling is "আকস্মিক"।', 'kind' => 'spelling' ),
			array( 'from' => 'স্বায়ত্বশাসন', 'to' => 'স্বায়ত্তশাসন', 'why' => 'Standard spelling is "স্বায়ত্তশাসন"।', 'kind' => 'spelling' ),
			array( 'from' => 'অনিবার্য্য', 'to' => 'অনিবার্য', 'why' => 'Double "য" is dropped।', 'kind' => 'spelling' ),
			array( 'from' => 'উপলক্ষ্য', 'to' => 'উপলক্ষে', 'why' => 'উপলক্ষে (উদ্দেশ্য/উপলক্ষে অর্থে য-ফলাহীন এ-কার হবে)।', 'kind' => 'spelling' ),

			// ── ৪. ং (অনুস্বার) বনাম ঙ ─────────────────────
			array( 'from' => 'রঙ্গীন', 'to' => 'রঙিন', 'why' => 'Standard modern spelling is "রঙিন"।', 'kind' => 'spelling' ),
			array( 'from' => 'ভাঙ্গা', 'to' => 'ভাঙা', 'why' => 'Bangla Academy standard prefers "ভাঙা"।', 'kind' => 'spelling' ),
			array( 'from' => 'আঙ্গুল', 'to' => 'আঙুল', 'why' => 'Standard modern spelling is "আঙুল"।', 'kind' => 'spelling' ),
			array( 'from' => 'টাঙ্গানো', 'to' => 'টাঙানো', 'why' => 'Standard modern spelling is "টাঙানো"।', 'kind' => 'spelling' ),
			array( 'from' => 'অংক', 'to' => 'অঙ্ক', 'why' => 'তৎসম শব্দে ক-বর্গের পূর্বে ঙ-যুক্ত রূপ প্রমিত: "অঙ্ক"।', 'kind' => 'spelling' ),
			array( 'from' => 'আতংক', 'to' => 'আতঙ্ক', 'why' => 'তৎসম শব্দে ঙ+ক যুক্ত রূপ "আতঙ্ক" প্রমিত।', 'kind' => 'spelling' ),
			array( 'from' => 'শংকিত', 'to' => 'শঙ্কিত', 'why' => 'তৎসম শব্দে ঙ+ক যুক্ত রূপ "শঙ্কিত" প্রমিত।', 'kind' => 'spelling' ),

			// ── ৫. বিসর্গ (ঃ) সংক্রান্ত প্রমিত নিয়ম ────────
			array( 'from' => 'কার্যতঃ', 'to' => 'কার্যত', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "কার্যত" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'ফলতঃ', 'to' => 'ফলত', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "ফলত" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'বস্তুতঃ', 'to' => 'বস্তুত', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "বস্তুত" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'প্রধানতঃ', 'to' => 'প্রধানত', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "প্রধানত" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'মূলতঃ', 'to' => 'মূলত', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "মূলত" হবে।', 'kind' => 'spelling' ),
			array( 'from' => 'প্রায়শঃ', 'to' => 'প্রায়শ', 'why' => 'শব্দের শেষের বিসর্গ বর্জিত হয়ে "প্রায়শ" হবে।', 'kind' => 'spelling' ),

			// ── ৬. সাধু-চলতি ও ক্রিয়ার রূপ ────────────────
			array( 'from' => 'যাইতেছিল', 'to' => 'যাচ্ছিল', 'why' => 'সাধু রূপ। প্রমিত চলিত গদ্যে "যাচ্ছিল" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'করিতেছিল', 'to' => 'করছিল', 'why' => 'সাধু রূপ। চলিত গদ্যে "করছিল" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'বলিয়াছিলেন', 'to' => 'বলেছিলেন', 'why' => 'সাধু রূপ। প্রমিত চলিত ভাষায় "বলেছিলেন" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'তাহাকে', 'to' => 'তাকে', 'why' => 'সাধু সর্বনাম। প্রমিত চলিত ভাষায় "তাকে" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'তাহাদের', 'to' => 'তাদের', 'why' => 'সাধু সর্বনাম। চলিত ভাষায় "তাদের" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'উহার', 'to' => 'তার', 'why' => 'সাধু সর্বনাম। চলিত ভাষায় "তার" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'ইহাতে', 'to' => 'এতে', 'why' => 'সাধু সর্বনাম। চলিত ভাষায় "এতে" ব্যবহার করুন।', 'kind' => 'grammar', 'optional' => true ),
			array( 'from' => 'করলো', 'to' => 'করল', 'why' => 'প্রমিত গদ্যে "করল" শ্রেয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'বললো', 'to' => 'বলল', 'why' => 'প্রমিত গদ্যে "বলল" ব্যবহার করতে পারেন।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'হলো', 'to' => 'হল', 'why' => 'প্রমিত গদ্যে "হল" রূপটি ব্যবহৃত হয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'গেলো', 'to' => 'গেল', 'why' => 'প্রমিত গদ্যে "গেল" রূপটি শ্রেয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'খেলো', 'to' => 'খেল', 'why' => 'প্রমিত গদ্যে "খেল" রূপটি শ্রেয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'দেখলো', 'to' => 'দেখল', 'why' => 'প্রমিত গদ্যে "দেখল" রূপটি শ্রেয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'শুনলো', 'to' => 'শুনল', 'why' => 'প্রমিত গদ্যে "শুনল" রূপটি শ্রেয়।', 'kind' => 'style', 'optional' => true ),
			array( 'from' => 'কেননা,', 'to' => 'কেননা', 'why' => '"কেননা"-র পর সাধারণত কমা বসানোর প্রয়োজন নেই।', 'kind' => 'punctuation' ),

			// ── ৭. বাহুল্য দোষ ও দ্বৈত বহুবচন ───────────────
			array( 'from' => 'সব পাখিরা', 'to' => 'সব পাখি', 'why' => 'দ্বৈত বহুবচন দোষ। "সব পাখি" অথবা "পাখিরা" লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'সকল সদস্যগণ', 'to' => 'সকল সদস্য', 'why' => 'দ্বৈত বহুবচন দোষ। "সকল সদস্য" বা "সদস্যগণ" লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'সকল মানুষেরা', 'to' => 'সকল মানুষ', 'why' => 'দ্বৈত বহুবচন দোষ। "সকল মানুষ" বা "মানুষেরা" লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'কেবলমাত্র', 'to' => 'কেবল', 'why' => 'বাহুল্য দোষ। "কেবল" অথবা "মাত্র" যেকোনো একটি লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'অশ্রুজল', 'to' => 'অশ্রু', 'why' => 'বাহুল্য দোষ। "অশ্রু" অর্থই চোখের জল।', 'kind' => 'grammar' ),
			array( 'from' => 'স্বপরিবারে', 'to' => 'সপরিবারে', 'why' => 'পরিবারসহ অর্থে "সপরিবারে" শুদ্ধ।', 'kind' => 'spelling' ),
			array( 'from' => 'লজ্জাস্কর', 'to' => 'লজ্জাকর', 'why' => 'শুদ্ধ রূপ "লজ্জাকর"।', 'kind' => 'spelling' ),
			array( 'from' => 'উৎকর্ষতা', 'to' => 'উৎকর্ষ', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। "উৎকর্ষ" লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'দারিদ্র্যতা', 'to' => 'দারিদ্র্য', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। "দারিদ্র্য" লিখুন।', 'kind' => 'grammar' ),
			array( 'from' => 'সখ্যতা', 'to' => 'সখ্য', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "সখ্য"।', 'kind' => 'grammar' ),
			array( 'from' => 'ঐক্যতা', 'to' => 'ঐক্য', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "ঐক্য"।', 'kind' => 'grammar' ),
			array( 'from' => 'দৈন্যতা', 'to' => 'দৈন্য', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "দৈন্য"।', 'kind' => 'grammar' ),
			array( 'from' => 'সৌজন্যতা', 'to' => 'সৌজন্য', 'why' => 'প্রত্যয়জনিত বাহুল্য দোষ। শুদ্ধ রূপ "সৌজন্য"।', 'kind' => 'grammar' ),

			// ── ৮. হ-এ ণ বনাম হ-এ ন ও শুদ্ধ বানান ─────────────
			array( 'from' => 'অপরাহ্ন', 'to' => 'অপরাহ্ণ', 'why' => 'তৎসম শব্দে র-এর পর হ-যুক্ত মূর্ধন্য "ণ" হবে ("অপরাহ্ণ")।', 'kind' => 'spelling' ),
			array( 'from' => 'মধাহ্ন', 'to' => 'মধ্যাহ্ন', 'why' => 'শুদ্ধ রূপ "মধ্যাহ্ন"।', 'kind' => 'spelling' ),
			array( 'from' => 'মধ্যহ্ন', 'to' => 'মধ্যাহ্ন', 'why' => 'শুদ্ধ বানান "মধ্যাহ্ন"।', 'kind' => 'spelling' ),
			array( 'from' => 'পূর্বাহ্ন', 'to' => 'পূর্বাহ্ণ', 'why' => 'তৎসম শব্দে রেফ-এর পর হ-যুক্ত মূর্ধন্য "ণ" হবে ("পূর্বাহ্ণ")।', 'kind' => 'spelling' ),
			array( 'from' => 'সায়াহ্ন', 'to' => 'সায়াহ্ণ', 'why' => 'শুদ্ধ বানান "সায়াহ্ন" (হ-এ দন্ত্য ন)।', 'kind' => 'spelling' ),
			array( 'from' => 'উপরোক্ত', 'to' => 'উপরি-উক্ত', 'why' => 'সন্ধিজনিত ভুল। শুদ্ধ রূপ "উপরি-উক্ত" বা "উপর্যুক্ত"।', 'kind' => 'spelling' ),
			array( 'from' => 'শিরচ্ছেদ', 'to' => 'শিরশ্ছেদ', 'why' => 'সন্ধিজাত শুদ্ধ বানান "শিরশ্ছেদ"।', 'kind' => 'spelling' ),
			array( 'from' => 'মুহূর্মুহু', 'to' => 'মুহুর্মুহু', 'why' => 'শুদ্ধ বানান "মুহুর্মুহু"।', 'kind' => 'spelling' ),
			array( 'from' => 'মনকষ্ট', 'to' => 'মনঃকষ্ট', 'why' => 'সন্ধির নিয়মে বিসর্গসহ শুদ্ধ রূপ "মনঃকষ্ট"।', 'kind' => 'spelling' ),
			array( 'from' => 'মন্ত্রীত্ব', 'to' => 'মন্ত্রিত্ব', 'why' => '"-ত্ব" প্রত্যয়ে হ্রস্ব "ি" হয় ("মন্ত্রিত্ব")।', 'kind' => 'spelling' ),
			array( 'from' => 'দায়ীত্ব', 'to' => 'দায়িত্ব', 'why' => 'শুদ্ধ বানান "দায়িত্ব"।', 'kind' => 'spelling' ),
			array( 'from' => 'আইনজীবি', 'to' => 'আইনজীবী', 'why' => '"-জীবী" প্রত্যয়যুক্ত শব্দে সর্বদা দীর্ঘ "ী" হবে ("আইনজীবী")।', 'kind' => 'spelling' ),
			array( 'from' => 'বুদ্ধিজীবি', 'to' => 'বুদ্ধিজীবী', 'why' => 'শুদ্ধ বানান "বুদ্ধিজীবী"।', 'kind' => 'spelling' ),
			array( 'from' => 'চাকুরিজীবি', 'to' => 'চাকরিজীবী', 'why' => 'আধুনিক প্রমিত রূপ "চাকরিজীবী"।', 'kind' => 'spelling' ),
			array( 'from' => 'পেশাজীবি', 'to' => 'পেশাজীবী', 'why' => 'শুদ্ধ বানান "পেশাজীবী"।', 'kind' => 'spelling' ),

			// ── ৯. English Rules ──────────────────────────
			array( 'from' => 'teh', 'to' => 'the', 'why' => 'Common typing error for "the".', 'kind' => 'spelling' ),
			array( 'from' => 'recieve', 'to' => 'receive', 'why' => 'Standard English spelling is "receive".', 'kind' => 'spelling' ),
			array( 'from' => 'seperate', 'to' => 'separate', 'why' => 'Standard English spelling is "separate".', 'kind' => 'spelling' ),
			array( 'from' => 'definately', 'to' => 'definitely', 'why' => 'Standard English spelling is "definitely".', 'kind' => 'spelling' ),
			array( 'from' => 'occured', 'to' => 'occurred', 'why' => 'Standard English spelling is "occurred".', 'kind' => 'spelling' ),
			array( 'from' => 'accomodate', 'to' => 'accommodate', 'why' => 'Standard English spelling is "accommodate".', 'kind' => 'spelling' ),
			array( 'from' => 'untill', 'to' => 'until', 'why' => 'Standard English spelling is "until".', 'kind' => 'spelling' ),
			array( 'from' => 'neccessary', 'to' => 'necessary', 'why' => 'Standard English spelling is "necessary".', 'kind' => 'spelling' ),
			array( 'from' => 'priviledge', 'to' => 'privilege', 'why' => 'Standard English spelling is "privilege".', 'kind' => 'spelling' ),
			array( 'from' => 'maintainance', 'to' => 'maintenance', 'why' => 'Standard English spelling is "maintenance".', 'kind' => 'spelling' ),
		);
	}

	public static function proofread( $request ) {
		$text     = $request->get_param( 'text' );
		$language = $request->get_param( 'language' ) ?: 'all';

		if ( empty( trim( $text ) ) ) {
			return new WP_Error( 'lipishilpo_empty', __( 'Please provide text to proofread.', 'lipishilpo' ), array( 'status' => 400 ) );
		}

		if ( mb_strlen( $text ) > 100000 ) {
			return new WP_Error( 'lipishilpo_limit', __( 'Maximum 100,000 characters allowed per check.', 'lipishilpo' ), array( 'status' => 400 ) );
		}

		$issues = array();
		$rules  = self::get_rules();

		foreach ( $rules as $rule ) {
			$from = $rule['from'];
			$to   = $rule['to'];

			$pattern = '/(?<![\\p{L}\\p{M}])' . preg_quote( $from, '/' ) . '(?![\\p{L}\\p{M}])/u';
			if ( preg_match( $pattern, $text ) ) {
				$issues[] = array(
					'from'     => $from,
					'to'       => $to,
					'why'      => $rule['why'],
					'kind'     => $rule['kind'],
					'optional' => ! empty( $rule['optional'] ),
					'count'    => preg_match_all( $pattern, $text ),
				);
			}
		}

		// Space before Bengali Dari
		if ( preg_match( '/[^\S\n]+[।]/u', $text ) ) {
			$issues[] = array(
				'from'     => ' ।',
				'to'       => '।',
				'why'      => 'Remove space before the Bengali period (দাঁড়ি)।',
				'kind'     => 'punctuation',
				'optional' => false,
				'count'    => preg_match_all( '/[^\S\n]+[।]/u', $text ),
			);
		}

		// Multiple spaces
		if ( preg_match( '/[^\S\n]{2,}/u', $text ) ) {
			$issues[] = array(
				'from'     => '__spaces',
				'to'       => ' ',
				'why'      => 'Multiple consecutive spaces found.',
				'kind'     => 'punctuation',
				'optional' => false,
				'count'    => 1,
			);
		}

		return rest_ensure_response( array(
			'issues' => $issues,
			'total'  => count( $issues ),
			'mode'   => 'rule-based',
		) );
	}
}
