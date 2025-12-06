import { URL } from 'node:url';

const eventsPolyfillUrl = new URL('./node-events-polyfill.mjs', import.meta.url);
const cryptoPolyfillUrl = new URL('./node-crypto-polyfill.mjs', import.meta.url);

export function resolve(specifier, context, defaultResolve) {
  if (specifier === 'node:events') {
    return { url: eventsPolyfillUrl.href };
  }
  if (specifier === 'node:crypto') {
    return { url: cryptoPolyfillUrl.href };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
