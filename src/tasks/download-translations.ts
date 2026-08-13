import { Buffer } from 'node:buffer';
import { unlink, writeFileSync } from 'node:fs';
import path from 'node:path';

import { LokaliseApi } from '@lokalise/node-api';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';

dotenv.config();

const AVAILABLE_LANGUAGES = ['en', 'es'];

const lokaliseApiToken = process.env.LOKALISE_API_TOKEN;
const lokaliseProjectId = process.env.LOKALISE_PROJECT_ID;

if (!lokaliseApiToken || !lokaliseProjectId) {
  throw new Error('LOKALISE_API_TOKEN or LOKALISE_PROJECT_ID is not set');
}

const lokaliseApi = new LokaliseApi({
  apiKey: lokaliseApiToken,
});
async function download(translationsUrl: string, archive: string) {
  try {
    const response = await fetch(translationsUrl);
    const buffer = await response.arrayBuffer();
    writeFileSync(archive, Buffer.from(buffer));
  } catch (error) {
    console.log(error);
  }
}

(async function () {
  try {
    const i18nFolder = path.resolve(__dirname, '../locales');

    const downloadResponse = await lokaliseApi.files().download(lokaliseProjectId, {
      format: 'json',
      original_filenames: true,
      directory_prefix: '',
      filter_langs: AVAILABLE_LANGUAGES,
      exclude_tags: ['emails'],
      indentation: '2sp',
      placeholder_format: 'icu',
    });

    const translationsUrl = downloadResponse.bundle_url;
    const archive = path.resolve(i18nFolder, 'archive.zip');

    await download(translationsUrl, archive);

    const zip = new AdmZip(archive);
    zip.extractAllTo(i18nFolder, true);

    unlink(archive, (err: any) => {
      if (err) {
        throw err;
      }
    });
  } catch (error) {
    console.log('ERROR --->', error);
  }
})();
