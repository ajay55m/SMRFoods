import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

import {useAuth} from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import WebViewScreen from '../screens/WebViewScreen';
import SplashScreen from '../screens/SplashScreen';
import ServerSlowScreen from '../screens/ServerSlowScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {user, isLoading} = useAuth();
  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{headerShown: false, animation: 'none'}}>
        {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : user ? (
          <Stack.Screen name="WebView" component={WebViewScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
        <Stack.Screen name="ServerSlow" component={ServerSlowScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
