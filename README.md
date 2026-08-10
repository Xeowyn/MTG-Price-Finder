# MTG Price Finder

A phone app for Magic: The Gathering players. Point your camera at a card, and it tells you what the card is worth.

## How to run it

This is a phone app, so a phone (or a phone emulator) is the only way to try the camera-scanning feature — that's a hardware limitation, not a packaging choice. But the search-and-price-lookup half of the app works in any browser, no install or phone needed at all:

**[Try it now — xeowyn.github.io/MTG-Price-Finder](https://xeowyn.github.io/MTG-Price-Finder/)** — no download, just click the link. Type a card name and see live prices. (The "Scan a Card" button is there too, but a browser can't use a phone's camera the way this app needs, so it'll explain that instead of opening a camera.)

**To try the camera scanning on your own phone:**

1. Install the **Expo Go** app from the App Store or Play Store
2. Run `npx expo start` in the project folder
3. Scan the QR code that shows up with your phone

Camera preview works in Expo Go, but reading the card name (OCR) needs the full app build below — Expo Go will show a message explaining this if you try to scan.

**Prefer to run the web version locally instead of the hosted link?**

```bash
git clone https://github.com/Xeowyn/MTG-Price-Finder.git
cd MTG-Price-Finder
npm install
npx expo start --web
```

**Full build with working camera scan (Android, needs Android Studio):**

1. Install [Android Studio](https://developer.android.com/studio), open it, and use the SDK Manager to install Android SDK Platform 35
2. In Android Studio, go to Device Manager and create a Pixel 7 emulator using system image API 35
3. Install [JDK 17](https://adoptium.net/) and restart your terminal
4. Start the emulator, then run:

```bash
npx expo run:android
```

The first build takes 5-10 minutes. After that, builds are fast.

## What it does

- Point your phone camera at a Magic card and it reads the card's name automatically (using on-device text recognition, no internet needed for that part)
- Or just type the card name into the search bar
- Shows live prices from TCGPlayer (USD), CardMarket (EUR), and Cardhoarder (MTGO tix), all pulled from [Scryfall](https://scryfall.com) — free, no account or API key needed
- Shows every printing of a card so you can compare prices across different sets

## What it's built with

- [Expo](https://expo.dev/) (React Native) — works on Android and iPhone from one codebase
- [ML Kit](https://developers.google.com/ml-kit) for reading text off the card in the camera view
- [Scryfall](https://scryfall.com) for card data and prices

## Project layout

- `App.js` — sets up the three screens (Home, Scan, Result) and how you move between them
- `src/screens/HomeScreen.js` — search bar and the button that opens the camera
- `src/screens/ScanScreen.js` — the camera view, takes the photo and reads the card name off it
- `src/screens/ResultScreen.js` — shows the card and its prices
- `src/api/scryfall.js` — talks to Scryfall to look up cards and prices
- `src/api/cardParser.js` — cleans up the raw camera text into just the card name
