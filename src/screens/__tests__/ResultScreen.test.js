import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import ResultScreen from '../ResultScreen';
import { fetchCardByName, fetchCardPrintings } from '../../api/scryfall';

jest.mock('../../api/scryfall', () => {
  const actual = jest.requireActual('../../api/scryfall');
  return {
    ...actual,
    fetchCardByName: jest.fn(),
    fetchCardPrintings: jest.fn(),
  };
});

function makeRoute(cardName = 'Lightning Bolt') {
  return { params: { cardName } };
}

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

const fullCard = {
  name: 'Lightning Bolt',
  type_line: 'Instant',
  mana_cost: '{R}',
  oracle_text: 'Lightning Bolt deals 3 damage to any target.',
  oracle_id: 'abc-123',
  set_name: 'Alpha',
  collector_number: '10',
  rarity: 'common',
  colors: ['R'],
  legalities: { modern: 'legal', standard: 'not_legal', pauper: 'legal' },
  prices: { usd: '2.50', usd_foil: '10.00', eur: '2.00', tix: '0.10' },
  purchase_uris: { tcgplayer: 'https://tcg', cardmarket: 'https://cm', cardhoarder: 'https://ch' },
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchCardPrintings.mockResolvedValue([]);
});

test('shows a loading state while the card is being fetched', async () => {
  fetchCardByName.mockReturnValue(new Promise(() => {}));
  await render(<ResultScreen route={makeRoute('Lightning Bolt')} navigation={makeNavigation()} />);
  expect(screen.getByText('Looking up "Lightning Bolt"…')).toBeTruthy();
});

test('renders card details and prices once loaded', async () => {
  fetchCardByName.mockResolvedValue(fullCard);
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Lightning Bolt')).toBeTruthy());
  expect(screen.getByText('Instant')).toBeTruthy();
  expect(screen.getByText('$2.50')).toBeTruthy();
  expect(screen.getByText('$10.00')).toBeTruthy();
  expect(screen.getByText('€2.00')).toBeTruthy();
  expect(screen.getByText('0.10 tix')).toBeTruthy();
});

test('shows N/A for prices the card does not have, without crashing', async () => {
  fetchCardByName.mockResolvedValue({
    ...fullCard,
    prices: { usd: '1.00' },
  });
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Lightning Bolt')).toBeTruthy());
  // dash is the display form for an "N/A" priced cell
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

test('shows a card with zero prices across every source without crashing', async () => {
  fetchCardByName.mockResolvedValue({
    ...fullCard,
    prices: { usd: '0.00', usd_foil: '0.00', eur: '0.00', tix: '0.00' },
  });
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Lightning Bolt')).toBeTruthy());
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

test('shows an error message and a retry button when the card is not found', async () => {
  fetchCardByName.mockRejectedValue(new Error('Card not found: "Not A Real Card"'));
  const navigation = makeNavigation();
  await render(<ResultScreen route={makeRoute('Not A Real Card')} navigation={navigation} />);

  await waitFor(() => expect(screen.getByText('Card not found: "Not A Real Card"')).toBeTruthy());
  expect(screen.getByText('← Try Again')).toBeTruthy();
});

test('shows an error message when the API is unreachable', async () => {
  fetchCardByName.mockRejectedValue(new TypeError('Network request failed'));
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Network request failed')).toBeTruthy());
});

test('does not show format legality for formats where the card is not_legal', async () => {
  fetchCardByName.mockResolvedValue(fullCard);
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Lightning Bolt')).toBeTruthy());
  expect(screen.getByText('Modern')).toBeTruthy();
  expect(screen.queryByText('Standard')).toBeNull();
});

test('handles a card with no legalities data without crashing', async () => {
  const { legalities, ...cardWithoutLegalities } = fullCard;
  fetchCardByName.mockResolvedValue(cardWithoutLegalities);
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('Lightning Bolt')).toBeTruthy());
});

test('handles a card missing an image without crashing', async () => {
  fetchCardByName.mockResolvedValue(fullCard);
  await render(<ResultScreen route={makeRoute()} navigation={makeNavigation()} />);

  await waitFor(() => expect(screen.getByText('No Image')).toBeTruthy());
});
