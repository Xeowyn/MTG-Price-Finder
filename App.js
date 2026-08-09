import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';

const Stack = createNativeStackNavigator();

const THEME = {
  dark: true,
  colors: {
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
