# লিপিশিল্প — WordPress manuscript editor

বাংলা ও অন্যান্য Unicode ভাষায় পাণ্ডুলিপি লেখা, অধ্যায় সাজানো, character/world Codex, browser-based proofreading এবং JSON backup-এর জন্য WordPress plugin।

ব্যবহার, সীমাবদ্ধতা, privacy ও Free/Pro পার্থক্যের মূল ডকুমেন্ট: [readme.txt](readme.txt)।

Bijoy converter বা built-in Avro phonetic engine নেই। Bengali conjuncts reference ও Avro key hints আছে। Spellchecking বাংলা ও US English dictionary-ভিত্তিক; অন্যান্য Unicode ভাষায় লেখা যায়।

## Build

Node.js 24-এ release build পরীক্ষা করা হয়েছে।

```sh
cd src
npm ci
npm run build
cd ..
node scripts/generate-notices.cjs
```

Readable source এবং lockfile src/ ফোল্ডারে রয়েছে। WordPress server-এ Node.js বা node_modules প্রয়োজন নেই।

## Regression tests

```sh
node tests/frontend-regressions.cjs
php tests/uninstall-regressions.php mixed
php tests/uninstall-regressions.php all
php tests/uninstall-regressions.php single-keep
php tests/uninstall-regressions.php single-delete
```

Local WordPress database-এ REST smoke tests: php tests/run-rest-regressions.php /path/to/wp-load.php। Test runner অস্থায়ী user ও manuscript তৈরি করে শেষে মুছে দেয়; উপযুক্ত PHP/MySQL configuration প্রয়োজন।

## Licensing

Original code: GPL-2.0-or-later ([LICENSE.txt](LICENSE.txt))।
JavaScript dependency notices: [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)।
Font notices: [assets/fonts/FONT-NOTICES.txt](assets/fonts/FONT-NOTICES.txt)।
Dictionary provenance: [assets/dicts/NOTICE.txt](assets/dicts/NOTICE.txt)।
