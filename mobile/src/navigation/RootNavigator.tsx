import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PortalWebViewScreen } from '../screens/web/PortalWebViewScreen';
import { useAuth } from '../contexts/AuthContext';

export function RootNavigator() {
  const { status } = useAuth();
  if (status === 'restoring') return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#06b6d4" /></View>;
  // The live Sales Portal is the APK's only UI. Its successful web login is
  // synchronized back to native through the authenticated WebView bridge.
  return <PortalWebViewScreen directLogin />;
}
