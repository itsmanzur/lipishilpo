/* oxlint-disable eslint/no-control-regex -- Strip characters invalid in XML and download filenames. */
import { zipSync, strToU8 } from 'fflate';
import { escapeXml as xml, type Project, validateProject } from './manuscript';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
export type BookSettings = {
  author: string;
  pageSize: 'A4' | 'A5';
  fontSize: number;
  lineHeight: number;
  marginMm: number;
  includeToc: boolean;
};
export const defaultBookSettings: BookSettings = {
  author: '',
  pageSize: 'A5',
  fontSize: 12,
  lineHeight: 1.5,
  marginMm: 18,
  includeToc: true,
};
export type FontFiles = {
  regular: Uint8Array;
  bold: Uint8Array;
  license: Uint8Array;
  latin: Uint8Array;
  latinBold: Uint8Array;
};
export function validateSettings(s: BookSettings) {
  if (
    !s ||
    !['A4', 'A5'].includes(s.pageSize) ||
    ![10, 11, 12, 13, 14, 16].includes(s.fontSize) ||
    ![1.3, 1.5, 1.8].includes(s.lineHeight) ||
    s.marginMm < 12 ||
    s.marginMm > 30 ||
    typeof s.author !== 'string' ||
    s.author.length > 200
  )
    throw new Error('বইয়ের ফরম্যাটের সেটিংস সঠিক নয়।');
}
export function paragraphs(text: string) {
  return text.replace(/\r\n?/g, '\n').split('\n');
}
export async function loadFonts(): Promise<FontFiles> {
  const names = [
    'NotoSerifBengali-Regular.ttf',
    'NotoSerifBengali-Bold.ttf',
    'OFL.txt',
    'NotoSerif-Regular.ttf',
    'NotoSerif-Bold.ttf',
  ];
  // WordPress plugin: root element থেকে font URL নেওয়া
  const root = document.getElementById('lipishilpo-root');
  const fontsBase = root?.dataset.fontsUrl ?? '/fonts/';

  const files = await Promise.all(
    names.map(async (name) => {
      const r = await fetch(fontsBase.replace(/\/$/, '') + '/' + name);
      if (!r.ok)
        throw new Error('বাংলা ফন্ট লোড হয়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
      return new Uint8Array(await r.arrayBuffer());
    }),
  );
  return { regular: files[0], bold: files[1], license: files[2], latin:files[3], latinBold:files[4] };
}
export function mixedText(text:string) {return text.split(/([\u0980-\u09ff\u0964\u0965\u200c\u200d]+)/u).filter(Boolean).map(text=>({text,font:/[\u0980-\u09ff\u0964\u0965]/u.test(text)?'NotoBengali':'NotoLatin'}));}
export function pdfDefinition(
  project: Project,
  s: BookSettings,
): TDocumentDefinitions {
  validateProject(project);
  validateSettings(s);
  const english = project.language === 'English';
  const content: Content[] = [
    {
      text: mixedText(project.title || 'পাণ্ডুলিপি'),
      fontSize: 28,
      bold: true,
      alignment: 'center',
      margin: [0, 90, 0, 25],
    },
    {
      text: mixedText(s.author),
      alignment: 'center',
      fontSize: 16,
      margin: [0, 0, 0, 20],
    },
  ];
  if (s.includeToc)
    content.push({
      toc: {
        title: {
          text: mixedText(english ? 'Contents' : 'সূচিপত্র'),
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 20],
        },
      },
      pageBreak: 'before',
    });
  for (const c of project.chapters) {
    content.push({
      text: mixedText(c.title || 'অধ্যায়'),
      fontSize: 21,
      bold: true,
      margin: [0, 0, 0, 24],
      pageBreak: 'before',
      // @ts-expect-error — tocItem exists at runtime but not in older @types/pdfmake
      tocItem: true,
    });
    for (const p of paragraphs(c.text))
      content.push({
        text: mixedText(p || ' '),
        margin: [0, 0, 0, p ? 6 : 3],
        preserveLeadingSpaces: true,
      });
  }
  return {
    info: { title: project.title, author: s.author, creator: 'লিপিশিল্প' },
    pageSize: s.pageSize,
    pageMargins: [
      (s.marginMm * 72) / 25.4,
      (s.marginMm * 72) / 25.4,
      (s.marginMm * 72) / 25.4,
      (s.marginMm * 72) / 25.4 + 10,
    ],
    defaultStyle: {
      font: 'NotoBengali',
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      color: '#222222',
    },
    content,
    footer: (page, pages) =>
      page === 1
        ? { text: '' }
        : {
            text: english
              ? `${page} / ${pages}`
              : `${page.toLocaleString('bn-BD')} / ${pages.toLocaleString('bn-BD')}`,
            font: english ? 'NotoLatin' : 'NotoBengali',
            alignment: 'center',
            fontSize: 10,
            margin: [0, 8, 0, 0],
          },
  };
}
function base64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}
export async function makePdf(
  project: Project,
  s: BookSettings,
  fonts: FontFiles,
): Promise<Blob> {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const fontMap = {
    NotoLatin:{normal:'Latin-Regular.ttf',bold:'Latin-Bold.ttf',italics:'Latin-Regular.ttf',bolditalics:'Latin-Bold.ttf'},
    NotoBengali: {
      normal: 'Noto-Regular.ttf',
      bold: 'Noto-Bold.ttf',
      italics: 'Noto-Regular.ttf',
      bolditalics: 'Noto-Bold.ttf',
    },
  };
  const vfs = {
    'Latin-Regular.ttf':base64(fonts.latin),
    'Latin-Bold.ttf':base64(fonts.latinBold),
    'Noto-Regular.ttf': base64(fonts.regular),
    'Noto-Bold.ttf': base64(fonts.bold),
  };
  return new Promise((resolve, reject) => {
    try {
      pdfMake
        .createPdf(pdfDefinition(project, s), undefined, fontMap, vfs)
        .getBlob(resolve);
    } catch (e) {
      reject(e);
    }
  });
}
export async function makeDocx(
  project: Project,
  s: BookSettings,
): Promise<Uint8Array> {
  validateProject(project);
  validateSettings(s);
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Footer,
    PageNumber,
    InternalHyperlink,
    Bookmark,
  } = await import('docx');
  const english = project.language === 'English';
  const font = 'Noto Serif Bengali';
  const run = {
    font: { ascii: 'Noto Serif', hAnsi: 'Noto Serif', cs: font, eastAsia: font },
    size: s.fontSize * 2,
    sizeComplexScript: s.fontSize * 2,
    language: { value: english ? 'en-US' : 'bn-BD' },
  };
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 600 },
      children: [
        new TextRun({
          ...run,
          text: project.title,
          bold: true,
          size: 56,
          sizeComplexScript: 56,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ ...run, text: s.author })],
    }),
  ];
  if (s.includeToc) {
    children.push(
      new Paragraph({
        text: english ? 'Contents' : 'সূচিপত্র',
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      }),
    );
    project.chapters.forEach((c, i) =>
      children.push(
        new Paragraph({
          children: [
            new InternalHyperlink({
              anchor: `chapter-${i}`,
              children: [new TextRun({ ...run, text: c.title })],
            }),
          ],
          spacing: { after: 160 },
        }),
      ),
    );
  }
  project.chapters.forEach((c, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        children: [
          new Bookmark({
            id: `chapter-${i}`,
            children: [
              new TextRun({
                ...run,
                text: c.title,
                bold: true,
                size: 40,
                sizeComplexScript: 40,
              }),
            ],
          }),
        ],
        spacing: { after: 400 },
      }),
    );
    for (const p of paragraphs(c.text))
      children.push(
        new Paragraph({
          children: [new TextRun({ ...run, text: p })],
          spacing: { after: 100, line: Math.round(240 * s.lineHeight) },
          widowControl: true,
        }),
      );
  });
  const page =
    s.pageSize === 'A5'
      ? { width: 8391, height: 11906 }
      : { width: 11906, height: 16838 };
  const margin = Math.round((s.marginMm * 1440) / 25.4);
  const doc = new Document({
    creator: 'লিপিশিল্প',
    title: project.title,
    description: 'লিপিশিল্প থেকে রপ্তানিকৃত পাণ্ডুলিপি',
    styles: {
      default: {
        document: {
          run,
          paragraph: { spacing: { line: Math.round(240 * s.lineHeight) } },
        },
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          run: { ...run, bold: true, size: 56, sizeComplexScript: 56 },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { ...run, bold: true, size: 40, sizeComplexScript: 40 },
          paragraph: { keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: page,
            margin: {
              top: margin,
              bottom: margin,
              left: margin,
              right: margin,
            },
          },
          titlePage: true,
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ ...run, children: [PageNumber.CURRENT] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}
export function makeEpub(
  project: Project,
  s: BookSettings,
  fonts: FontFiles,
): Uint8Array {
  validateProject(project);
  validateSettings(s);
  const lang = project.language === 'English' ? 'en' : 'bn';
  const id = 'urn:uuid:' + crypto.randomUUID();
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const xhtml = (title: string, body: string) =>
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}"><head><title>${xml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>${body}</body></html>`;
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    mimetype: [strToU8('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': strToU8(
      '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
    ),
  };
  files['EPUB/title.xhtml'] = strToU8(
    xhtml(
      project.title,
      `<section class="titlepage" epub:type="titlepage"><h1>${xml(project.title)}</h1><p>${xml(s.author)}</p></section>`,
    ),
  );
  files['EPUB/nav.xhtml'] = strToU8(
    xhtml(
      lang === 'en' ? 'Contents' : 'সূচিপত্র',
      `<nav epub:type="toc" id="toc"><h1>${lang === 'en' ? 'Contents' : 'সূচিপত্র'}</h1><ol>${project.chapters.map((c, i) => `<li><a href="chapter-${i}.xhtml">${xml(c.title)}</a></li>`).join('')}</ol></nav>`,
    ),
  );
  files['EPUB/style.css'] = strToU8(
    `@font-face{font-family:Lipishilpo;src:url('fonts/regular.ttf')}@font-face{font-family:Lipishilpo;src:url('fonts/bold.ttf');font-weight:bold}@font-face{font-family:LipishilpoLatin;src:url('fonts/latin.ttf')}@font-face{font-family:LipishilpoLatin;src:url('fonts/latin-bold.ttf');font-weight:bold}body{font-family:Lipishilpo,LipishilpoLatin,serif;line-height:${s.lineHeight};margin:5%;}p{white-space:pre-wrap;margin:0 0 .65em;}h1{font-size:1.8em;line-height:1.5;page-break-after:avoid;}a{color:inherit}section.titlepage{text-align:center;padding-top:20%;}`,
  );
  files['EPUB/fonts/regular.ttf'] = fonts.regular;
  files['EPUB/fonts/bold.ttf'] = fonts.bold;
  files['EPUB/fonts/OFL.txt'] = fonts.license;
  files['EPUB/fonts/latin.ttf']=fonts.latin;
  files['EPUB/fonts/latin-bold.ttf']=fonts.latinBold;
  project.chapters.forEach((c, i) => {
    files[`EPUB/chapter-${i}.xhtml`] = strToU8(
      xhtml(
        c.title,
        `<section epub:type="chapter"><h1>${xml(c.title)}</h1>${paragraphs(
          c.text,
        )
          .map((p) => `<p>${p ? xml(p) : '&#160;'}</p>`)
          .join('')}</section>`,
      ),
    );
  });
  files['EPUB/package.opf'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${lang}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${id}</dc:identifier><dc:title>${xml(project.title)}</dc:title><dc:language>${lang}</dc:language>${s.author ? `<dc:creator>${xml(s.author)}</dc:creator>` : ''}<meta property="dcterms:modified">${date}</meta></metadata><manifest><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/><item id="regular" href="fonts/regular.ttf" media-type="font/ttf"/><item id="bold" href="fonts/bold.ttf" media-type="font/ttf"/><item id="latin" href="fonts/latin.ttf" media-type="font/ttf"/><item id="latin-bold" href="fonts/latin-bold.ttf" media-type="font/ttf"/><item id="license" href="fonts/OFL.txt" media-type="text/plain"/>${project.chapters.map((_, i) => `<item id="c${i}" href="chapter-${i}.xhtml" media-type="application/xhtml+xml"/>`).join('')}</manifest><spine><itemref idref="title"/>${s.includeToc ? '<itemref idref="nav"/>' : ''}${project.chapters.map((_, i) => `<itemref idref="c${i}"/>`).join('')}</spine></package>`,
  );
  return zipSync(files, { level: 6 });
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
