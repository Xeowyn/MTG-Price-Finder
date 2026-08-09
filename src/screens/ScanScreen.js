import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractCardName } from '../api/cardParser';

const COLORS = {
  bg: '#000',
  gold: '#c9a84c',
  text: '#f0e6d3',
  textMuted: '#7a7060',
  overlay: 'rgba(0,0,0,0.5)',
  reticle: '#c9a84c',
};

const PHOTO_QUALITY = 0.8;
const NAME_CROP_HEIGHT_FRACTION = 0.25;
const CROPPED_IMAGE_WIDTH = 800;
const CROPPED_IMAGE_COMPRESSION = 0.85;
const RESULT_HINT_DELAY_MS = 800;

// Expo Go can't load native modules like ML Kit, so we load it only if it's there.
// This way the app still opens in Expo Go — scanning just won't work until a real build.
let TextRecognizer = null;
try {
  TextRecognizer = require('@react-native-ml-kit/text-recognition').default;
} catch {
  // Not available — we're in Expo Go
}

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [hint, setHint] = useState('Frame the card name at the top');
  const cameraRef = useRef(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;

    if (!TextRecognizer) {
      Alert.alert(
        'Dev Build Required',
        'Camera scanning requires a development build.\n\nUse the search bar on the home screen instead, or follow the setup guide to build the app with Android Studio.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    setProcessing(true);
    setHint('Reading card...');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: PHOTO_QUALITY });

      // Cut down to just the top of the card, where the name is printed
      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: 0,
              originY: 0,
              width: photo.width,
              height: Math.floor(photo.height * NAME_CROP_HEIGHT_FRACTION),
            },
          },
          { resize: { width: CROPPED_IMAGE_WIDTH } },
        ],
        { compress: CROPPED_IMAGE_COMPRESSION, format: ImageManipulator.SaveFormat.JPEG }
      );

      const result = await TextRecognizer.recognize(cropped.uri);
      const cardName = extractCardName(result.blocks);

      if (!cardName) {
        setHint('Could not read card name — try again');
        setProcessing(false);
        return;
      }

      setHint(`Found: "${cardName}"`);

      // Wait a moment so the user can see what card name was found before moving on
      setTimeout(() => {
        navigation.navigate('Result', { cardName });
        setProcessing(false);
        setHint('Frame the card name at the top');
      }, RESULT_HINT_DELAY_MS);
    } catch (err) {
      console.error('Scan error:', err);
      setHint('Error reading card — try again');
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  if (!permission.granted) {
    // On Android, once the user picks "Don't ask again", requestPermission() can't
    // prompt anymore — the only way back in is the phone's own Settings screen.
    if (permission.canAskAgain === false) {
      return (
        <View style={styles.center}>
          <Text style={styles.permText}>
            Camera access is turned off for this app. Turn it on in your phone's Settings to scan cards.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.permBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission is needed to scan cards.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        {/* Dark overlay with transparent window for card name area */}
        <View style={styles.overlayTop} />
        <View style={styles.reticleRow}>
          <View style={styles.overlaySide} />
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>{hint}</Text>
          <TouchableOpacity
            style={[styles.captureBtn, processing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={processing}
          >
            {processing
              ? <ActivityIndicator color="#000" />
              : <View style={styles.captureInner} />
            }
          </TouchableOpacity>
          <Text style={styles.hintSmall}>
            {TextRecognizer ? 'Tap to scan' : 'OCR unavailable in Expo Go'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const RETICLE_H = 70;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  camera: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  permText: { color: COLORS.text, textAlign: 'center', marginBottom: 20, fontSize: 15 },
  permBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

  // Overlay layers
  overlayTop: {
    height: 160,
    backgroundColor: COLORS.overlay,
  },
  reticleRow: {
    height: RETICLE_H,
    flexDirection: 'row',
  },
  overlaySide: {
    width: 24,
    backgroundColor: COLORS.overlay,
  },
  reticle: {
    flex: 1,
    borderWidth: 0,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    paddingTop: 30,
    gap: 12,
  },

  // Corner reticle markers
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.reticle,
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  hint: { color: COLORS.gold, fontSize: 15, fontWeight: '600' },
  hintSmall: { color: COLORS.textMuted, fontSize: 12 },

  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gold,
  },
});
