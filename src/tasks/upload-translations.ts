 
import { Buffer } from 'node:buffer';

import { LokaliseApi } from '@lokalise/node-api';
import dotenv from 'dotenv';

import englishI18nFile from '../locales/en.json';

dotenv.config();

const lokaliseProjectId = process.env.LOKALISE_PROJECT_ID;
const lokaliseApiToken = process.env.LOKALISE_API_TOKEN;
const filename = 'en.json';
const lang_iso = 'en';

if (!lokaliseApiToken || !lokaliseProjectId) {
  throw new Error('LOKALISE_API_TOKEN or LOKALISE_PROJECT_ID is not set');
}

(async function () {
  const lokaliseApi = new LokaliseApi({ apiKey: lokaliseApiToken });
  try {
    const data_base64 = Buffer.from(JSON.stringify(englishI18nFile)).toString('base64');
    const process = await lokaliseApi.files().upload(lokaliseProjectId, {
      data: data_base64,
      filename,
      lang_iso,
      replace_modified: false,
      convert_placeholders: true,
    });
    console.log('upload process --->', process.status);
  } catch (error) {
    console.log('ERROR --->', error);
  }
})();
