import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';
import { fetchAutocompleteSuggestions } from '../../api/scryfall';

jest.mock('../../api/scryfall');

function makeNavigation() {
  return { navigate: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchAutocompleteSuggestions.mockResolvedValue([]);
});

test('renders the search bar and scan button', async () => {
  await render(<HomeScreen navigation={makeNavigation()} />);
  expect(screen.getByPlaceholderText('e.g. Lightning Bolt')).toBeTruthy();
  expect(screen.getByText('Scan a Card')).toBeTruthy();
});

test('tapping the scan button navigates to the Scan screen', async () => {
  const navigation = makeNavigation();
  await render(<HomeScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText('Scan a Card'));
  expect(navigation.navigate).toHaveBeenCalledWith('Scan');
});

test('typing 2+ characters fetches and shows autocomplete suggestions', async () => {
  fetchAutocompleteSuggestions.mockResolvedValue(['Shock', 'Shockwave']);
  await render(<HomeScreen navigation={makeNavigation()} />);

  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), 'Sho');

  await waitFor(() => expect(screen.getByText('Shock')).toBeTruthy());
  expect(screen.getByText('Shockwave')).toBeTruthy();
  expect(fetchAutocompleteSuggestions).toHaveBeenCalledWith('Sho');
});

test('typing fewer than 2 characters does not fetch suggestions', async () => {
  await render(<HomeScreen navigation={makeNavigation()} />);
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), 'S');
  expect(fetchAutocompleteSuggestions).not.toHaveBeenCalled();
});

test('shows no suggestion list when the API returns none', async () => {
  fetchAutocompleteSuggestions.mockResolvedValue([]);
  await render(<HomeScreen navigation={makeNavigation()} />);
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), 'zzz');
  await waitFor(() => expect(fetchAutocompleteSuggestions).toHaveBeenCalled());
  expect(screen.queryByText('Shock')).toBeNull();
});

test('does not crash and shows no suggestions when the autocomplete API fails', async () => {
  fetchAutocompleteSuggestions.mockRejectedValue(new Error('Network request failed'));
  await render(<HomeScreen navigation={makeNavigation()} />);
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), 'Sho');
  await waitFor(() => expect(fetchAutocompleteSuggestions).toHaveBeenCalled());
  expect(screen.queryByText('Sho')).toBeNull();
});

test('tapping a suggestion navigates to Result with that card name', async () => {
  fetchAutocompleteSuggestions.mockResolvedValue(['Shock']);
  const navigation = makeNavigation();
  await render(<HomeScreen navigation={navigation} />);

  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), 'Sho');
  await waitFor(() => expect(screen.getByText('Shock')).toBeTruthy());
  await fireEvent.press(screen.getByText('Shock'));

  expect(navigation.navigate).toHaveBeenCalledWith('Result', { cardName: 'Shock' });
});

test('submitting the search bar navigates with the typed text', async () => {
  const navigation = makeNavigation();
  await render(<HomeScreen navigation={navigation} />);
  const input = screen.getByPlaceholderText('e.g. Lightning Bolt');
  await fireEvent.changeText(input, 'Lightning Bolt');
  await fireEvent(input, 'submitEditing');
  expect(navigation.navigate).toHaveBeenCalledWith('Result', { cardName: 'Lightning Bolt' });
});

test('pressing Go with an empty search box does nothing', async () => {
  const navigation = makeNavigation();
  await render(<HomeScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText('Go'));
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('pressing Go with only whitespace does nothing', async () => {
  const navigation = makeNavigation();
  await render(<HomeScreen navigation={navigation} />);
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Lightning Bolt'), '   ');
  await fireEvent.press(screen.getByText('Go'));
  expect(navigation.navigate).not.toHaveBeenCalled();
});
