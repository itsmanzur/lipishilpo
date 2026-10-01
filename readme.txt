=== Lipishilpo — Bengali & Multilingual Manuscript Studio ===
Contributors: itsmanzur
Tags: bengali, writing, novel, manuscript, editor
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Write Bengali and multilingual manuscripts with chapters, browser-based proofreading, character notes, snapshots, and portable backups.

== Description ==

Lipishilpo (লিপিশিল্প) is a manuscript editor inside WordPress. Organize chapters, write in Bengali or other Unicode scripts, keep character and world-building notes, and export your work.

The interface supports Bengali and English. Dictionary-based spellchecking is available for Bengali and US English. Rule-based suggestions and writing statistics are editing aids; they do not replace human proofreading or guarantee compliance with a publishing standard.

= Writing and organization =

* Chapter reordering, research notes, and Draft / In Progress / Revised / Final status.
* Focus and typewriter modes, five editor color themes, and locally bundled fonts.
* Slash commands, a selection toolbar, smart quotation marks, and a formatting reference.
* Manuscript markup for headings, dialogue, poems, footnotes, and highlights.
* Character and world-building Codex, comments, snapshots, and edit history.
* Project-wide find and replace, word counts, sentence-length statistics, and dialogue estimates.
* Bengali conjuncts reference with Avro key hints and character insertion.

= Saving, import, and export =

* Autosave to your WordPress site, with a warning when another tab or device has saved a newer version.
* Download a local JSON backup before loading the latest server copy after a conflict.
* JSON backups include chapters, chapter status, notes, Codex, snapshots, comments, and edit history.
* Export plain text, Markdown, and HTML; import JSON backups, plain text, Markdown, and Word (.docx).
* Word import extracts manuscript content; it does not preserve all Word page layout, images, or formatting.
* The default limit is 200 chapters and 500,000 manuscript characters per project. Import files are limited to 12 MB. Imports exceeding the chapter limit are rejected instead of being truncated.

Lipishilpo Pro is a separate optional plugin for additional AI and publication tools. The Free plugin's writing, local proofreading, and basic export features do not require a paid license.

== Installation ==

1. Upload the lipishilpo folder to /wp-content/plugins/, or upload the plugin ZIP through Plugins > Add New.
2. Activate Lipishilpo and open its menu in WordPress Admin.
3. Alternatively, add the [lipishilpo] shortcode to a page.
4. Sign in with an account that can edit posts. A shortcode page does not grant editing access to visitors or subscriber accounts.

== Frequently Asked Questions ==

= Does it include Bijoy conversion or an Avro typing engine? =

No. It includes a Bengali conjuncts reference with Avro key hints and insertion helpers. Use your preferred Unicode keyboard or input method for phonetic typing. Bijoy-to-Unicode and Unicode-to-Bijoy conversion are not included.

= Where is my manuscript stored? =

Projects and related metadata are stored in your site's WordPress database. The plugin's project API checks ownership before allowing access. Site administrators with database or server access can still access stored site data. User preferences are stored in WordPress user metadata, with selected preferences cached in the browser.

= Does it send writing to an external service? =

The Free plugin does not send manuscripts to an external AI or proofreading service and does not include telemetry. Fonts and spellchecking dictionaries are bundled and loaded from your own site. Import parsing and proofreading run in the browser. Saving, loading, and publishing contact your WordPress site. Optional add-ons may have their own external-service settings and disclosures.

= Does it work offline? =

Proofreading runs locally after the dictionaries have loaded. Loading and saving projects requires a connection to your WordPress site. Download backups before closing a tab with unsaved changes.

= Can I publish to WordPress? =

Yes. You can create a draft or publish a post or page when your WordPress account has the corresponding capabilities.

= Does the Free plugin export DOCX, PDF, or EPUB? =

No. Free exports plain text, Markdown, HTML, and JSON backups. It can import DOCX. Additional publication formats belong to the separate Pro add-on.

= What happens when I uninstall the plugin? =

Project data is retained by default. Administrators can enable deletion in the plugin settings. On multisite, each site's setting controls its project cleanup; shared user preferences are retained if any site keeps its data. Browser caches and previously downloaded backups are not deleted by uninstalling the plugin.

== Changelog ==

= 1.0.0 =
* Initial release of the manuscript editor, chapter tools, local proofreading, and Codex.
* JSON backup and restore, text/Markdown/HTML exports, and DOCX import.
* Serialized autosave and revision checks to prevent stale tabs overwriting newer saves.
* Partial-update protection, automatic snapshots before large text reductions, and import overflow validation.
* Account-specific dictionary caches, scoped editor styles, and multisite-aware cleanup.

== Third-Party Components ==

Original plugin code is licensed under GPL-2.0-or-later; see LICENSE.txt. Bundled components retain their original licenses and copyright notices.

* JavaScript: React, React DOM, Lucide React, Mammoth, nspell, and their runtime dependencies. Exact installed versions, upstream source links, and complete license texts are in THIRD-PARTY-NOTICES.txt. JSZip uses its MIT license option; Pako includes MIT and zlib notices.
* Fonts: Hind Siliguri (Indian Type Foundry), Noto Sans Bengali / Noto Serif Bengali / Noto Serif (The Noto Project Authors), and Tiro Bangla (The Indigo Project Authors / Tiro Typeworks). Licensed under SIL Open Font License 1.1. See assets/fonts/FONT-NOTICES.txt and the family-specific LICENSE-*.txt files.
* Bengali dictionary: Jacob Thomas / Bengal Creative Media Ltd., published by Bangla Type Foundry under GPLv2. Original readable dictionary files, upstream notice, and GPLv2 text are included in assets/dicts/.
* English dictionary: LibreOffice's en_US Hunspell dictionary derived from SCOWL. Its component copyright notices and permissive license terms are included in assets/dicts/README-en-US-upstream.txt.

These bundled components are not external services. Source URLs and dictionary provenance are recorded in assets/dicts/NOTICE.txt and assets/fonts/SOURCES.txt.

== Source Code ==

The readable TypeScript/React source and locked npm dependency manifest are included in src/ in this distribution.

To rebuild the editor:

1. Use Node.js and npm (the release build was tested with Node.js 24).
2. From the src/ directory, run npm ci.
3. Run npm run build. Vite writes the browser assets to assets/js/ and assets/css/.
4. From the plugin root, run node scripts/generate-notices.cjs after dependency changes to regenerate the JavaScript notices.

Third-party package sources are available from the repository and npm links in THIRD-PARTY-NOTICES.txt. No node_modules directory is required on the WordPress server.
