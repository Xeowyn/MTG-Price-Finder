import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';

// Using the plain-JS stack navigator (not native-stack) because native-stack's
// header crashes on web (relies on react-native-screens internals that aren't
// implemented there) -- this version works the same on phone and in a browser.
const Stack = createStackNavigator();

// Spreading React Navigation's own DarkTheme first because it carries a
// `fonts` object the header needs (added as a required theme field in v7) --
// without it, opening any screen with a header crashes reading `fonts.bold`.
// Only `colors` is actually customized here.
const THEME = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#c9a84c',
    background: '#0e0e0e',
    card: '#1a1a1a',
    text: '#f0e6d3',
    border: '#2e2e2e',
    notification: '#c9a84c',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={THEME}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#c9a84c',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerBackTitle: 'Back',
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: 'Scan Card', headerTransparent: true, headerTintColor: '#c9a84c' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={({ route }) => ({ title: route.params?.cardName || 'Card Details' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
