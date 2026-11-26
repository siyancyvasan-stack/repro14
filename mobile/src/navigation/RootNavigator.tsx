import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PortalWebViewScreen } from '../screens/web/PortalWebViewScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useAuth } from '../contexts/AuthContext';

export function RootNavigator() {
  const { status, user } = useAuth();
  if (status === 'restoring') return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#06b6d4" /></View>;
  if (status === 'signedOut' || !user) return <LoginScreen />;
  // One native login establishes the authenticated API session. The portal is
  // then opened full-screen through the one-time server handoff, so users do
  // not enter their credentials twice.
  return <PortalWebViewScreen />;
}
