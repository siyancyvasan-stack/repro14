import React from 'react';
import { PortalWebViewScreen } from '../screens/web/PortalWebViewScreen';

export function RootNavigator() {
  // The APK is a full-screen Reproutes web client. Authentication, portal
  // navigation, theme, and business features all come from the hosted sales
  // portal instead of the legacy native shell.
  return <PortalWebViewScreen directLogin />;
}
