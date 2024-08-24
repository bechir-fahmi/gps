const fs = require('fs');
const glob = require('glob');
const path = require('path');

const i18nFolder = './src/assets/i18n';
const languages = ['en', 'fr', 'ar'];
const translationFiles = {};

languages.forEach(lang => {
  try {
    const filePath = path.join(i18nFolder, `${lang}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(fileContent || '{}');
  } catch (error) {
    console.error(`Error parsing ${lang}.json:`, error.message);
    translationFiles[lang] = {}; // Fallback to an empty object if parsing fails
  }
});

function extractText(node) {
  return node.replace(/{{.*?}}/g, '').trim();
}

function generateKey(text) {
  return text.replace(/\s+/g, '_').toUpperCase();
}

function replaceTextInHtml(file) {
  const html = fs.readFileSync(file, 'utf8');
  let updatedHtml = html;
  const textMatches = html.match(/>([^<]+)</g);

  if (textMatches) {
    textMatches.forEach(match => {
      const text = extractText(match);
      if (text) {
        const key = generateKey(text);
        updatedHtml = updatedHtml.replace(text, `{{ '${key}' | translate }}`);

        languages.forEach(lang => {
          if (!translationFiles[lang][key]) {
            translationFiles[lang][key] = lang === 'en' ? text : '';
          }
        });
      }
    });

    fs.writeFileSync(file, updatedHtml, 'utf8');
  }
}

glob.sync('./src/**/*.html').forEach(file => replaceTextInHtml(file));

languages.forEach(lang => {
  fs.writeFileSync(path.join(i18nFolder, `${lang}.json`), JSON.stringify(translationFiles[lang], null, 2), 'utf8');
});
