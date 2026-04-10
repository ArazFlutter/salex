import type { WebDriver } from 'selenium-webdriver';
import { waitForPageLoad } from './seleniumSession';

/**
 * Sequential UI navigation: for each step, try label variants until one
 * clickable element matches (platform text often differs from SALex).
 */
export async function selectCategoryPathWithVariants(
  driver: WebDriver,
  segmentVariants: string[][],
  timeoutMs: number,
  logPrefix: string,
): Promise<void> {
  for (let i = 0; i < segmentVariants.length; i++) {
    const variants = segmentVariants[i].map((v) => v.trim()).filter(Boolean);
    if (variants.length === 0) {
      continue;
    }

    const salexHint = variants[0];
    let clicked = false;
    for (const label of variants) {
      clicked = await clickCategoryLabel(driver, label);
      if (clicked) {
        console.log(`[${logPrefix}] category step ${i + 1}: matched UI label "${label}" (segment "${salexHint}")`);
        break;
      }
    }

    if (!clicked) {
      throw new Error(
        `${logPrefix}: CATEGORY_PATH_NAV_FAILED — no clickable UI match for path step ${i + 1} ` +
          `(segment "${salexHint}"; tried: ${variants.join(' | ')})`,
      );
    }

    await waitForPageLoad(driver, timeoutMs);
  }
}

/**
 * @deprecated Prefer selectCategoryPathWithVariants + platformCategoryLabels.
 */
export async function selectCategoryPathByText(
  driver: WebDriver,
  segments: string[],
  timeoutMs: number,
  logPrefix: string,
): Promise<void> {
  const asVariants = segments.map((s) => [s.trim()].filter(Boolean));
  await selectCategoryPathWithVariants(driver, asVariants, timeoutMs, logPrefix);
}

function clickCategoryLabel(driver: WebDriver, rawLabel: string): Promise<boolean> {
  return driver.executeScript<boolean>(
    `
    var rawLabel = arguments[0];
    function norm(s) {
      if (!s) return '';
      try {
        return s.normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trim();
      } catch (e) {
        return String(s).toLowerCase().replace(/\\s+/g, ' ').trim();
      }
    }

    function matches(text, target) {
      if (!text || !target) return false;
      if (text === target) return true;
      if (target.length < 4) return text === target;
      if (text.length > 200) return false;
      return text.includes(target) || target.includes(text);
    }

    function tryClick(el) {
      var node = el;
      for (var depth = 0; depth < 8 && node; depth++) {
        var tag = (node.tagName || '').toLowerCase();
        var role = node.getAttribute && node.getAttribute('role');
        if (
          tag === 'a' ||
          tag === 'button' ||
          tag === 'label' ||
          role === 'button' ||
          role === 'option' ||
          role === 'tab' ||
          (tag === 'li' && role !== 'presentation')
        ) {
          try {
            node.scrollIntoView({ block: 'center', inline: 'nearest' });
            node.click();
            return true;
          } catch (e1) { /* try parent */ }
        }
        node = node.parentElement;
      }
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
        return true;
      } catch (e2) {
        return false;
      }
    }

    var target = norm(rawLabel);
    if (!target) return false;

    var selectorGroups = [
      'a',
      'button',
      '[role="button"]',
      '[role="option"]',
      '[role="tab"]',
      'li',
      'span',
      'div',
      'p',
      'label',
    ];

    for (var g = 0; g < selectorGroups.length; g++) {
      var nodes = document.querySelectorAll(selectorGroups[g]);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var text = norm(el.textContent || '');
        if (!matches(text, target)) continue;
        if (tryClick(el)) return true;
      }
    }
    return false;
  `,
    rawLabel,
  );
}
