import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

import { LanguageProvider } from './src/services/i18n';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    textarea, input, select {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}

import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <Toast />
        </SafeAreaProvider>
      </LanguageProvider>
    </Provider>
  );
}
