const BASE = 'https://api.scryfall.com';

// Scryfall's autocomplete needs at least this many letters to return useful results
export const MIN_AUTOCOMPLETE_QUERY_LENGTH = 2;

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

// Scryfall (or the network) sometimes has a one-off hiccup -- a dropped
// connection, a brief 503 -- that has nothing to do with whether the card
// exists. Retrying a couple of times before giving up turns those blips into
// a slightly slower successful lookup instead of a hard error. Retries are
// invisible on success; on final failure this behaves exactly like a single
// plain fetch() would have (same resolved response, or the same thrown
// error), so callers don't need to know retrying happened at all.
async function fetchWithRetry(url, attempts = RETRY_ATTEMPTS) {
  let lastResponse;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      // Only a server-side 5xx is worth retrying -- a 4xx (not found, bad
      // query) is a real answer that won't change on retry.
      if (res.ok || res.status < 500) return res;
      lastResponse = res;
    } catch (err) {
      if (i === attempts - 1) throw err;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    }
  }
  return lastResponse;
}

// Looks up a card by name. Works even with typos or a partial name.
export async function fetchCardByName(name) {
  const res = await fetchWithRetry(`${BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`);
  if (!res.ok) {
    let message = `Card not found: "${name}"`;
    try {
      const err = await res.json();
      if (err.details) message = err.details;
    } catch {
      // API sent back something that wasn't JSON — just use the generic message above
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchAutocompleteSuggestions(query) {
  if (!query || query.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) return [];
  const res = await fetchWithRetry(`${BASE}/cards/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

// Gets every set a card has been printed in, so we can show prices for each one
export async function fetchCardPrintings(oracleId) {
  const res = await fetchWithRetry(
    `${BASE}/cards/search?q=oracleid%3A${oracleId}&order=released&unique=prints`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export function formatPrice(value, currency = '$', suffix = '') {
  if (!value || value === '0.00') return 'N/A';
  return `${currency}${parseFloat(value).toFixed(2)}${suffix}`;
}

// Groups a card's prices by store (TCGPlayer, CardMarket, Cardhoarder)
export function getPrices(card) {
  const p = card.prices || {};
  return {
    tcgplayer: {
      label: 'TCGPlayer',
      normal: formatPrice(p.usd),
      foil: formatPrice(p.usd_foil),
      etched: formatPrice(p.usd_etched),
      url: card.purchase_uris?.tcgplayer,
    },
    cardmarket: {
      label: 'CardMarket',
      normal: formatPrice(p.eur, '€'),
      foil: formatPrice(p.eur_foil, '€'),
      url: card.purchase_uris?.cardmarket,
    },
    cardhoarder: {
      label: 'Cardhoarder (MTGO)',
      normal: formatPrice(p.tix, '', ' tix'),
      url: card.purchase_uris?.cardhoarder,
    },
  };
}
