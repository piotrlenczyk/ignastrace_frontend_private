# Translations

We use Lokalise for managing translations.

## Translations flow

Now that we are in production, the translation flow is as follows:

1. We only modify the en.json file with the approved texts.
2. If we cannot build the application due to missing translations in other languages, we add placeholders for those languages.
3. Once we have pushed the repository to their GitHub repositories, we ask the translation team to update the translated files before pushing to production.

## Important!

Do not download or upload translations to Lokalise—it is their responsibility. Importing our files can cause issues because the Lokalise Node.js library encodes some keys differently. This is why they prefer that we don’t handle translations on our end. Our only task is to update en.json when necessary.

Lokalise does not automatically delete unused keys, so some remain in their system. Since we need one of these keys again, we should notify them that it has been reintroduced and is already available in their Lokalise project for review.

## Use the CLI (now it's not needed unless the translation team requires us to do it)

Make sure you have the required environment variables set up (`LOKALISE_API_TOKEN` and `LOKALISE_PROJECT_ID`) in your `.env` file.

Available translation commands:

- `npm run lokalise:download` - Download latest translations from Lokalise to your local project
- `npm run lokalise:upload` - Upload new translation keys from your local project to Lokalise

Note: These commands only work in development environment.

## Add support for a new language:

1. Add the locale code to `AVAILABLE_LANGUAGES` array in `src/tasks/download-translations.ts`:
2. Create a new locale file in `src/locales/your-new-locale.json`
3. Run `npm run download-translations` to fetch the translations
4. Add the new locale to `LanguageLocale` enum in `src/utils/config.ts`
