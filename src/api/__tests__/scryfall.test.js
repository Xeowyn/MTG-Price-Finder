import {
  formatPrice,
  getPrices,
  fetchCardByName,
  fetchAutocompleteSuggestions,
  fetchCardPrintings,
} from '../scryfall';

function mockFetchOnce({ ok = true, status = 200, json = {} }) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(json),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('formatPrice', () => {
  test('formats a normal USD price', () => {
    expect(formatPrice('4.5')).toBe('$4.50');
  });

  test('formats with a different currency symbol', () => {
    expect(formatPrice('3.2', '€')).toBe('€3.20');
  });

  test('adds a suffix when given one', () => {
    expect(formatPrice('1.25', '', ' tix')).toBe('1.25 tix');
  });

  test('returns N/A for null', () => {
    expect(formatPrice(null)).toBe('N/A');
  });

  test('returns N/A for undefined', () => {
    expect(formatPrice(undefined)).toBe('N/A');
  });

  test('returns N/A for a zero price', () => {
    expect(formatPrice('0.00')).toBe('N/A');
  });

  test('returns N/A for an empty string', () => {
    expect(formatPrice('')).toBe('N/A');
  });
});

describe('getPrices', () => {
  test('shapes a full price object with all sources present', () => {
    const card = {
      prices: { usd: '10.00', usd_foil: '20.00', usd_etched: '30.00', eur: '9.00', eur_foil: '18.00', tix: '2.50' },
      purchase_uris: { tcgplayer: 'https://tcg', cardmarket: 'https://cm', cardhoarder: 'https://ch' },
    };
    const prices = getPrices(card);
    expect(prices.tcgplayer).toEqual({
      label: 'TCGPlayer',
      normal: '$10.00',
      foil: '$20.00',
      etched: '$30.00',
      url: 'https://tcg',
    });
    expect(prices.cardmarket).toEqual({
      label: 'CardMarket',
      normal: '€9.00',
      foil: '€18.00',
      url: 'https://cm',
    });
    expect(prices.cardhoarder).toEqual({
      label: 'Cardhoarder (MTGO)',
      normal: '2.50 tix',
      url: 'https://ch',
    });
  });

  test('shows N/A for prices a card does not have, instead of crashing', () => {
    // a card with only a normal USD price, nothing else (typical for a common)
    const card = { prices: { usd: '0.25' } };
    const prices = getPrices(card);
    expect(prices.tcgplayer.normal).toBe('$0.25');
    expect(prices.tcgplayer.foil).toBe('N/A');
    expect(prices.tcgplayer.etched).toBe('N/A');
    expect(prices.cardmarket.normal).toBe('N/A');
    expect(prices.cardhoarder.normal).toBe('N/A');
  });

  test('handles a card with no prices object at all', () => {
    const card = {};
    const prices = getPrices(card);
    expect(prices.tcgplayer.normal).toBe('N/A');
    expect(prices.cardmarket.normal).toBe('N/A');
    expect(prices.cardhoarder.normal).toBe('N/A');
    expect(prices.tcgplayer.url).toBeUndefined();
  });

  test('handles missing purchase_uris without crashing', () => {
    const card = { prices: { usd: '1.00' } };
    const prices = getPrices(card);
    expect(prices.tcgplayer.url).toBeUndefined();
  });
});

describe('fetchCardByName', () => {
  test('returns the card on success', async () => {
    mockFetchOnce({ ok: true, json: { name: 'Lightning Bolt' } });
    const card = await fetchCardByName('Lightning Bolt');
    expect(card).toEqual({ name: 'Lightning Bolt' });
  });

  test('throws using the API-provided message when the card is not found', async () => {
    mockFetchOnce({ ok: false, status: 404, json: { details: 'No cards found matching that name' } });
    await expect(fetchCardByName('Not A Real Card')).rejects.toThrow('No cards found matching that name');
  });

  test('falls back to a generic message when the error body has no details', async () => {
    mockFetchOnce({ ok: false, status: 404, json: {} });
    await expect(fetchCardByName('Xyz')).rejects.toThrow('Card not found: "Xyz"');
  });

  test('shows a friendly message, not a raw parse error, when the API returns a non-JSON error body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    });
    await expect(fetchCardByName('Anything')).rejects.toThrow('Card not found: "Anything"');
  });

  test('rejects when the network is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(fetchCardByName('Anything')).rejects.toThrow('Network request failed');
  });
});

describe('fetchAutocompleteSuggestions', () => {
  test('returns suggestions on success', async () => {
    mockFetchOnce({ ok: true, json: { data: ['Shock', 'Shockwave'] } });
    const results = await fetchAutocompleteSuggestions('Shoc');
    expect(results).toEqual(['Shock', 'Shockwave']);
  });

  test('returns an empty list for a query that is too short, without calling fetch', async () => {
    global.fetch = jest.fn();
    expect(await fetchAutocompleteSuggestions('a')).toEqual([]);
    expect(await fetchAutocompleteSuggestions('')).toEqual([]);
    expect(await fetchAutocompleteSuggestions(undefined)).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns an empty list instead of throwing when the API errors', async () => {
    mockFetchOnce({ ok: false, status: 500, json: {} });
    expect(await fetchAutocompleteSuggestions('Shock')).toEqual([]);
  });

  test('returns an empty list instead of throwing when the network is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(fetchAutocompleteSuggestions('Shock')).rejects.toThrow();
  });

  test('returns an empty list when the API response is missing the data field', async () => {
    mockFetchOnce({ ok: true, json: {} });
    expect(await fetchAutocompleteSuggestions('Shock')).toEqual([]);
  });
});

describe('fetchCardPrintings', () => {
  test('returns printings on success', async () => {
    mockFetchOnce({ ok: true, json: { data: [{ id: '1' }, { id: '2' }] } });
    const results = await fetchCardPrintings('abc-123');
    expect(results).toEqual([{ id: '1' }, { id: '2' }]);
  });

  test('returns an empty list instead of throwing when the API errors', async () => {
    mockFetchOnce({ ok: false, status: 500, json: {} });
    expect(await fetchCardPrintings('abc-123')).toEqual([]);
  });

  test('returns an empty list when the API response is missing the data field', async () => {
    mockFetchOnce({ ok: true, json: {} });
    expect(await fetchCardPrintings('abc-123')).toEqual([]);
  });
});
