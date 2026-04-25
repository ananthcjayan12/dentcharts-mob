import { ConsentSection } from '../api/types';

export interface ConsentPlaceholderContext {
  doctor: string;
  procedure: string;
  condition: string;
  anesthesia: string;
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const replaceAllPlain = (input: string, searchValue: string, replaceValue: string): string =>
  input.split(searchValue).join(replaceValue);

export const escapeHtml = (value: string): string =>
  replaceAllPlain(
    replaceAllPlain(
      replaceAllPlain(replaceAllPlain(replaceAllPlain(value, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
      '"',
      '&quot;'
    ),
    "'",
    '&#39;'
  );

export const replaceConsentPlaceholders = (text: string, context: ConsentPlaceholderContext): string => {
  if (!text) return '';
  return replaceAllPlain(
    replaceAllPlain(
      replaceAllPlain(
        replaceAllPlain(text, '{doctor}', context.doctor || '________________'),
        '{procedure}',
        context.procedure || '________________'
      ),
      '{condition}',
      context.condition || '________________'
    ),
    '{anesthesia}',
    context.anesthesia || '________________'
  );
};

export const dedupeRepeatedParagraphs = (text: string): string => {
  if (!text) return '';

  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return '';
  }

  const seen = new Set<string>();
  const uniqueBlocks: string[] = [];

  blocks.forEach((block) => {
    const key = normalizeWhitespace(block);
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueBlocks.push(block);
    }
  });

  return uniqueBlocks.join('\n\n');
};

export const hydrateConsentSections = (
  sections: ConsentSection[] = [],
  context: ConsentPlaceholderContext
): ConsentSection[] => {
  return sections.map((section) => ({
    heading: section.heading ? replaceConsentPlaceholders(section.heading, context) : section.heading,
    body: section.body ? replaceConsentPlaceholders(section.body, context) : section.body,
    items: (section.items || []).map((item) => replaceConsentPlaceholders(item, context)),
    numbered: (section.numbered || []).map((item) => replaceConsentPlaceholders(item, context)),
    footer: section.footer ? replaceConsentPlaceholders(section.footer, context) : section.footer,
  }));
};

export const chunkConsentSections = (sections: ConsentSection[], pageSize = 3): ConsentSection[][] => {
  if (!sections.length) {
    return [[]];
  }

  const pages: ConsentSection[][] = [];
  for (let index = 0; index < sections.length; index += pageSize) {
    pages.push(sections.slice(index, index + pageSize));
  }
  return pages;
};

const sectionWeight = (section: ConsentSection): number => {
  const headingWeight = (section.heading || '').length * 0.6;
  const bodyWeight = (section.body || '').length;
  const itemsWeight = (section.items || []).reduce((sum, item) => sum + item.length, 0) * 0.9;
  const numberedWeight = (section.numbered || []).reduce((sum, item) => sum + item.length, 0) * 0.9;
  const footerWeight = (section.footer || '').length;
  // Each section has a fixed visual overhead: spacing, margins, and optional list bullets.
  const structuralOverhead = 220;
  return headingWeight + bodyWeight + itemsWeight + numberedWeight + footerWeight + structuralOverhead;
};

export const paginateConsentSections = (
  sections: ConsentSection[],
  options?: {
    firstPageCapacity?: number;
    otherPageCapacity?: number;
    maxSectionsPerPage?: number;
  }
): ConsentSection[][] => {
  if (!sections.length) {
    return [[]];
  }

  const firstPageCapacity = options?.firstPageCapacity ?? 3600;
  const otherPageCapacity = options?.otherPageCapacity ?? 4300;
  const maxSectionsPerPage = options?.maxSectionsPerPage ?? 4;

  const pages: ConsentSection[][] = [];
  let currentPage: ConsentSection[] = [];
  let currentWeight = 0;

  const pushPage = () => {
    if (!currentPage.length) return;
    pages.push(currentPage);
    currentPage = [];
    currentWeight = 0;
  };

  sections.forEach((section) => {
    const pageIndex = pages.length;
    const capacity = pageIndex === 0 ? firstPageCapacity : otherPageCapacity;
    const weight = sectionWeight(section);

    const exceedsWeight = currentWeight + weight > capacity;
    const exceedsCount = currentPage.length >= maxSectionsPerPage;

    if ((exceedsWeight || exceedsCount) && currentPage.length > 0) {
      pushPage();
    }

    currentPage.push(section);
    currentWeight += weight;
  });

  pushPage();
  return pages.length ? pages : [[]];
};

export const renderSectionHtml = (section: ConsentSection): string => {
  const parts: string[] = [];
  if (section.heading) {
    parts.push(`<h4 style="margin:0 0 6px;font-size:14px;">${escapeHtml(section.heading)}</h4>`);
  }

  if (section.body) {
    const bodyHtml = replaceAllPlain(escapeHtml(section.body), '\n', '<br/>');
    parts.push(`<p style="margin:0 0 8px;line-height:1.5;">${bodyHtml}</p>`);
  }

  if (section.items?.length) {
    const list = section.items.map((item) => `<li style="margin-bottom:4px;">${escapeHtml(item)}</li>`).join('');
    parts.push(`<ul style="margin:0 0 8px 18px;">${list}</ul>`);
  }

  if (section.numbered?.length) {
    const list = section.numbered.map((item) => `<li style="margin-bottom:4px;">${escapeHtml(item)}</li>`).join('');
    parts.push(`<ol style="margin:0 0 8px 18px;">${list}</ol>`);
  }

  if (section.footer) {
    const footerHtml = replaceAllPlain(escapeHtml(section.footer), '\n', '<br/>');
    parts.push(`<p style="margin:0 0 8px;line-height:1.5;">${footerHtml}</p>`);
  }

  return `<section style="margin-bottom:14px;">${parts.join('')}</section>`;
};
