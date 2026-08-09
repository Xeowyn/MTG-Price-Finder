import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import ScanScreen from '../ScanScreen';

// Simulates Expo Go, where the native ML Kit module doesn't exist. ScanScreen.js does
// `require('@react-native-ml-kit/text-recognition')` in a try/catch at the top of the
// file, so mocking the module to throw here (before ScanScreen is imported above)
// exercises that fallback path.
jest.mock('@react-native-ml-kit/text-recognition', () => {
  throw new Error('Native module not available');
});

jest.mock('expo-camera', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    CameraView: ReactActual.forwardRef((props, ref) => ReactActual.createElement(View, null, props.children)),
    useCameraPermissions: jest.fn(),
  };
});

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.setTimeout(20000);

test('tells the user OCR is unavailable when the native text recognizer module cannot load', async () => {
  useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
  await render(<ScanScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />);

  expect(screen.getByText('OCR unavailable in Expo Go')).toBeTruthy();
});
