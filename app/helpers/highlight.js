import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

const createSpan = function(text, highlight) {
  return `<span class="${highlight ? 'highlight' : ''}">${text}</span>`;
};

/**
 * Breaks apart a string, wraps the parts with a span
 * and gives the span a class of highlight when it matches
 * the search value
 * @param {String} search The value of the search box
 * @param {String} str text to highlight
 * @return {String} spans
 */

export function highlight([search, str]) {
  if (!search) { return str; }

  if (typeof search === 'string') {
    search = new RegExp(search, 'g');
  }

  const unmatched = str.split(search);
  const matched = str.match(search);

  let pieces = createSpan(unmatched.shift());

  while (unmatched.length > 0) {
    if (matched.length) {
      pieces += createSpan(matched.shift(), true);
    }

    if (unmatched.length) {
      pieces += createSpan(unmatched.shift());
    }
  }

  return htmlSafe(pieces);
}

export default helper(highlight);
