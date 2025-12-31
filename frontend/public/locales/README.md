# Localization (i18n) Structure

This directory contains translation files for internationalization support.

## Directory Structure

```
locales/
├── en/              # English translations (default)
│   ├── common.json  # Shared text (header, footer, buttons)
│   ├── home.json    # Home page content
│   ├── searchBar.json # Search bar component
│   └── guide.json   # API key guide page
└── [future languages]
```

## Adding a New Language

To add support for a new language:

1. Create a new directory with the language code (e.g., `es` for Spanish, `fr` for French)
2. Copy all JSON files from the `en` directory
3. Translate the values (keep the keys unchanged)
4. The language code should follow ISO 639-1 standard

Example:
```bash
mkdir public/locales/es
cp public/locales/en/*.json public/locales/es/
# Then translate the content in each file
```

## Usage in Components

Once an i18n library is integrated (e.g., next-intl or react-i18next), use translations like:

```tsx
import { useTranslations } from 'next-intl';

function Header() {
  const t = useTranslations('common.header');

  return (
    <h1>{t('title')}{t('titleHighlight')}</h1>
  );
}
```

## Translation File Format

All translation files use JSON format with nested objects:

```json
{
  "section": {
    "key": "Translated text",
    "nested": {
      "deepKey": "More text"
    }
  }
}
```

## Available Translation Namespaces

- **common**: Shared text across the entire app (header, footer, buttons, errors)
- **home**: Home page specific content (empty state, features)
- **searchBar**: Search bar component text (titles, placeholders, API key)
- **guide**: YouTube API key guide page (steps, troubleshooting, best practices)

## Supported Languages

- ✅ English (en) - Default
- 🔲 Spanish (es) - Planned
- 🔲 French (fr) - Planned
- 🔲 German (de) - Planned
- 🔲 Arabic (ar) - Planned

## Notes

- Keep keys consistent across all language files
- Use descriptive key names (e.g., `button.submit` instead of `btn1`)
- Include context in comments for translators when needed
- Test RTL languages (Arabic, Hebrew) separately for layout issues
