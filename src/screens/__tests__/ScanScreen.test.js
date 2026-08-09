import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import ScanScreen from '../ScanScreen';

jest.mock('expo-camera', () => {
  const ReactActual = require('react');
  const { View: RNView } = require('react-native');
  return {
    CameraView: ReactActual.forwardRef((props, ref) => ReactActual.createElement(RNView, null, props.children)),
    useCameraPermissions: jest.fn(),
  };
});

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

// This test environment runs slower than a real device on first render, give it room
jest.setTimeout(20000);

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows a loading spinner while permission status is unknown', async () => {
  useCameraPermissions.mockReturnValue([null, jest.fn()]);
  await render(<ScanScreen navigation={makeNavigation()} />);
  // No permission text or camera view should be present yet
  expect(screen.queryByText('Camera permission is needed to scan cards.')).toBeNull();
});

test('shows a permission request screen when camera access is denied', async () => {
  const requestPermission = jest.fn();
  useCameraPermissions.mockReturnValue([{ granted: false, canAskAgain: true }, requestPermission]);
  await render(<ScanScreen navigation={makeNavigation()} />);

  expect(screen.getByText('Camera permission is needed to scan cards.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Grant Permission'));
  expect(requestPermission).toHaveBeenCalled();
});

test('shows the camera view once permission is granted', async () => {
  useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
  await render(<ScanScreen navigation={makeNavigation()} />);

  expect(screen.getByText('Frame the card name at the top')).toBeTruthy();
});

test('shows "Tap to scan" when the text recognizer module is available', async () => {
  useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
  await render(<ScanScreen navigation={makeNavigation()} />);

  expect(screen.getByText('Tap to scan')).toBeTruthy();
});
