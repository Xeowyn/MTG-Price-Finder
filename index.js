// Must be the very first import -- @react-navigation/stack needs this set up
// before anything else touches the navigation library.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

// This makes the app start the same way in Expo Go and in a real build.
registerRootComponent(App);
