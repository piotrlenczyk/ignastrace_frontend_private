#!/usr/bin/env node
/*
 * Opens an implemented route in a real Chrome window and records what it
 * actually renders: full-page screenshots per viewport, plus a computed-style
 * audit.
 *
 * The audit is the part that earns this script its keep. Comparing two PNGs by
 * eye reliably catches layout mistakes and reliably misses the ones that matter
 * most here — a 15px font where the design says 16, #414651 where the token
 * resolves to #535862, a 12px radius that should be 10. Those are invisible at
 * screenshot scale and are exactly what a token-driven redesign gets wrong. So
 * the script also dumps the numbers, and they can be diffed against the Figma
 * variable values instead of squinted at.
 *
 * Usage (from the repo root):
 *
 *   node .claude/skills/figma-screen-redesign/scripts/review-screen.mjs \
 *     --url /checkout \
 *     --out .tmp/figma-screens/checkout
 *
 * Options:
 *   --url <path|url>      Route to open. A bare path is joined onto --base.
 *   --out <dir>           Where PNGs and audit JSON land. Created if absent.
 *   --base <origin>       Dev server origin. Default: probe https then http on 3000.
 *   --viewport n=WxH      Repeatable. Default: desktop=1440x900 and mobile=390x844.
 *   --steps <json>        Interactions to capture extra states. See below.
 *   --audit <selector>    Limit the style audit to this subtree. Default: body.
 *   --audit-limit <n>     Max elements in the audit. Default 160.
 *   --pause               Wait for Enter before capturing — use it to log in by
 *                         hand on an authenticated route, or just to look.
 *   --keep-open           Leave the browser open when done.
 *   --headless            Run without a window (screenshots only, no watching).
 *
 * --steps takes a JSON array applied after the initial capture, per viewport:
 *
 *   [{"label":"modal","click":"[data-testid=open-modal]"},
 *    {"label":"hover","hover":"button[type=submit]"},
 *    {"label":"filled","type":{"selector":"#email","text":"a@b.co"}},
 *    {"label":"scrolled","scroll":400},
 *    {"label":"after-wait","waitFor":"[role=dialog]"}]
 *
 * Each step produces impl-<viewport>-<label>.png and audit-<viewport>-<label>.json,
 * and steps accumulate — step 2 runs on the state step 1 left behind, which is
 * what you want for open-modal-then-hover-the-primary-button sequences.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline';

const argv = process.argv.slice(2);

function flag(name) {
  return argv.includes(`--${name}`);
}

function opt(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 || i === argv.length - 1 ? fallback : argv[i + 1];
}

function optAll(name) {
  return argv.reduce((acc, arg, i) => {
    if (arg === `--${name}` && argv[i + 1]) acc.push(argv[i + 1]);
    return acc;
  }, []);
}

/*
 * puppeteer is a dependency of the app, not of this script's directory, so a
 * bare import only resolves because .claude/ lives inside the repo. Fall back to
 * resolving from the working directory so a copy of the script somewhere else
 * still works when run from the repo root.
 */
async function loadPuppeteer() {
  try {
    return (await import('puppeteer')).default;
  } catch {
    const { createRequire } = await import('node:module');
    const require = createRequire(path.join(process.cwd(), 'noop.js'));
    try {
      return require('puppeteer');
    } catch {
      console.error(
        'Could not load puppeteer. Run this from the repo root; if it still fails,\n' +
          'the browser binary may be missing — `npx puppeteer browsers install chrome`.',
      );
      process.exit(2);
    }
  }
}

function parseViewports() {
  const raw = optAll('viewport');
  const list = raw.length ? raw : ['desktop=1440x900', 'mobile=390x844'];
  return list.map((entry) => {
    const [name, size] = entry.includes('=') ? entry.split('=') : ['view', entry];
    const match = /^(\d+)x(\d+)$/.exec(size ?? '');
    if (!match) {
      console.error(`Bad --viewport "${entry}". Expected name=WIDTHxHEIGHT, e.g. desktop=1440x900.`);
      process.exit(2);
    }
    return { name, width: Number(match[1]), height: Number(match[2]) };
  });
}

/*
 * `npm run dev` starts Next with --experimental-https, so the dev server is
 * usually https on a self-signed cert; but a plain http server on the same port
 * is common enough (and another project may hold 3000) that guessing wrong and
 * reporting "the page is blank" would be worse than probing.
 */
async function probeBase() {
  const candidates = [
    'https://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3001',
    'http://localhost:3001',
  ];
  for (const origin of candidates) {
    try {
      const res = await fetch(origin, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(3000),
      });
      if (res.status < 500) return origin;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function waitForEnter(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(`${message} `, () => {
      rl.close();
      resolve();
    }),
  );
}

/*
 * Read back the properties a redesign can get wrong. Only elements that are
 * actually painted are included — a hidden subtree contributes noise, and its
 * computed values are frequently the pre-layout defaults rather than anything
 * the markup asked for.
 */
const AUDIT_FN = (rootSelector, limit) => {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return { error: `selector not found: ${rootSelector}` };

  const PROPS = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'boxShadow',
    'outlineColor',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textTransform',
    'padding',
    'gap',
  ];
  /*
   * Values every element carries whether or not anyone asked for them. Emitting
   * them triples the file and buries the handful of properties that actually
   * came from a class. `lineHeight: normal` is deliberately not in here — on a
   * redesigned element it means no text style was applied, which is a finding.
   */
  const DEFAULTS = {
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderColor: 'rgb(0, 0, 0)',
    outlineColor: 'rgb(0, 0, 0)',
    borderWidth: '0px',
    borderRadius: '0px',
    boxShadow: 'none',
    letterSpacing: 'normal',
    textTransform: 'none',
    padding: '0px',
    gap: 'normal',
  };

  const rows = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = root;
  while (node && rows.length < limit) {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const painted =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) > 0 &&
      box.width > 0 &&
      box.height > 0;

    if (painted) {
      const values = {};
      for (const prop of PROPS) {
        const value = style[prop];
        if (!value || value === DEFAULTS[prop]) continue;
        // Family strings are long and identical everywhere; the head is enough.
        values[prop] = prop === 'fontFamily' ? value.split(',')[0].replace(/["']/g, '') : value;
      }
      const ownText = Array.from(node.childNodes)
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent.trim())
        .join(' ')
        .slice(0, 60);

      rows.push({
        tag: node.tagName.toLowerCase(),
        classes: typeof node.className === 'string' ? node.className.slice(0, 240) : '',
        text: ownText,
        rect: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          w: Math.round(box.width),
          h: Math.round(box.height),
        },
        ...values,
      });
    }
    node = walker.nextNode();
  }

  return {
    root: rootSelector || 'body',
    truncated: rows.length >= limit,
    documentHeight: document.documentElement.scrollHeight,
    elements: rows,
  };
};

async function settle(page) {
  // Web fonts land after networkidle, and every text metric depends on them.
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function capture(page, outDir, name, auditSelector, auditLimit) {
  await settle(page);
  const png = path.join(outDir, `impl-${name}.png`);
  await page.screenshot({ path: png, fullPage: true });
  const audit = await page.evaluate(AUDIT_FN, auditSelector, auditLimit);
  const json = path.join(outDir, `audit-${name}.json`);
  await writeFile(json, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(`  ${png}`);
  console.log(`  ${json}${audit.truncated ? '  (truncated — raise --audit-limit or narrow --audit)' : ''}`);
}

async function applyStep(page, step) {
  if (step.waitFor) await page.waitForSelector(step.waitFor, { timeout: 8000 });
  if (step.click) {
    await page.waitForSelector(step.click, { timeout: 8000 });
    await page.click(step.click);
  }
  if (step.hover) {
    await page.waitForSelector(step.hover, { timeout: 8000 });
    await page.hover(step.hover);
  }
  if (step.type) {
    await page.waitForSelector(step.type.selector, { timeout: 8000 });
    await page.type(step.type.selector, step.type.text, { delay: 15 });
  }
  if (step.focus) await page.focus(step.focus);
  if (typeof step.scroll === 'number') {
    await page.evaluate((y) => window.scrollTo(0, y), step.scroll);
  }
  if (step.waitAfter) await new Promise((resolve) => setTimeout(resolve, step.waitAfter));
}

async function main() {
  const target = opt('url');
  const outDir = opt('out');
  if (!target || !outDir) {
    console.error('Both --url and --out are required. See the header of this file for usage.');
    process.exit(2);
  }

  const base = opt('base') ?? (target.startsWith('http') ? '' : await probeBase());
  if (!target.startsWith('http') && !base) {
    console.error(
      'No dev server answered on localhost:3000 or :3001.\n' +
        'Start it (`npm run dev`) or pass --base <origin>. This script never starts it itself,\n' +
        "because a server it owns would die with it and take the session's hot reload with it.",
    );
    process.exit(1);
  }
  const url = target.startsWith('http') ? target : new URL(target, base).toString();

  const viewports = parseViewports();
  const auditSelector = opt('audit') ?? null;
  const auditLimit = Number(opt('audit-limit', '160'));
  let steps = [];
  if (opt('steps')) {
    try {
      steps = JSON.parse(opt('steps'));
    } catch (error) {
      console.error(`--steps is not valid JSON: ${error.message}`);
      process.exit(2);
    }
  }

  await mkdir(outDir, { recursive: true });

  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: flag('headless'),
    acceptInsecureCerts: true, // the dev server's cert is self-signed
    defaultViewport: null,
    args: ['--window-size=1500,1000', '--force-device-scale-factor=1'],
  });

  console.log(`Reviewing ${url}`);

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2, // text edges are unreadable at 1x on a 1440 shot
        isMobile: viewport.width < 768,
        hasTouch: viewport.width < 768,
      });

      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300));
      });

      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      const status = response?.status();
      console.log(`\n${viewport.name} (${viewport.width}x${viewport.height}) — HTTP ${status ?? '?'}`);
      if (status && status >= 400) {
        console.log('  Page returned an error status — the route or locale prefix may be wrong.');
      }

      if (flag('pause')) {
        await waitForEnter(`  Browser is open at ${viewport.name}. Press Enter to capture...`);
      }

      await capture(page, outDir, viewport.name, auditSelector, auditLimit);

      for (const [index, step] of steps.entries()) {
        const label = step.label ?? `step${index + 1}`;
        try {
          await applyStep(page, step);
          await capture(page, outDir, `${viewport.name}-${label}`, auditSelector, auditLimit);
        } catch (error) {
          console.log(`  step "${label}" failed: ${error.message.split('\n')[0]}`);
        }
      }

      if (consoleErrors.length) {
        console.log(`  ${consoleErrors.length} console error(s):`);
        for (const text of consoleErrors.slice(0, 5)) console.log(`    ${text}`);
      }

      if (!flag('keep-open')) await page.close();
    }

    if (flag('keep-open')) {
      await waitForEnter('\nBrowser left open. Press Enter to close...');
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
