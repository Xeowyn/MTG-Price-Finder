const BASE = 'https://api.scryfall.com';

// Fuzzy card name search — tolerates typos and partial names
export async function fetchCardByName(name) {
  const res = await fetch(`${BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.details || `Card not found: "${name}"`);
  }
  return res.json();
}

// Autocomplete suggestions for the search bar
export async function fetchAutocompleteSuggestions(query) {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${BASE}/cards/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

// All printings of a card (for different set prices)
export async function fetchCardPrintings(oracleId) {
  const res = await fetch(
    `${BASE}/cards/search?q=oracleid%3A${oracleId}&order=released&unique=prints`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

// Format a Scryfall price into a display string
export function formatPrice(value, currency = '$', suffix = '') {
  if (!value || value === '0.00') return 'N/A';
  return `${currency}${parseFloat(value).toFixed(2)}${suffix}`;
}

// Pull the structured price breakdown from a Scryfall card object
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
