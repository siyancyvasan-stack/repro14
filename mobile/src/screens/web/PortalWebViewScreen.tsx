import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { environment } from '../../config/environment';
import { api } from '../../services/api';
import { reconcileBackgroundTracking } from '../../services/backgroundTracking';
import { useAuth } from '../../contexts/AuthContext';

export function PortalWebViewScreen({ directLogin = false }: { directLogin?: boolean }) {
  const { signOut, user } = useAuth();
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState('');
  const [portalUrl, setPortalUrl] = useState('');

  const openPortal = useCallback(async () => {
    setLoading(true); setError(''); setPortalUrl('');
    try {
      if (directLogin) {
        setPortalUrl(`${environment.webUrl}/sales/login`);
        setLoading(false);
        return;
      }
      const handoff = await api.post<{ code: string }>('/api/v1/auth/webview-handoff', {});
      setPortalUrl(`${environment.webUrl}/mobile/session?code=${encodeURIComponent(handoff.code)}`);
    } catch (reason) {
      setLoading(false);
      setError(reason instanceof Error ? reason.message : 'Unable to create the secure portal session.');
    }
  }, [directLogin]);

  useEffect(() => { void openPortal(); }, [openPortal]);

  // Never leave the APK on an endless spinner when DNS, TLS, the portal, or
  // the one-time handoff is unavailable on the device network.
  useEffect(() => {
    if (!portalUrl || !loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Reproutes portal took too long to respond. Check internet access and tap Retry.');
    }, 15_000);
    return () => clearTimeout(timeout);
  }, [portalUrl, loading]);

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webView.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const onNavigation = (state: WebViewNavigation) => setCanGoBack(state.canGoBack);
  const portalOrigin = new URL(environment.webUrl).origin;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    {portalUrl ? <WebView
      ref={webView}
      source={{ uri: portalUrl }}
      originWhitelist={[`${portalOrigin}/*`]}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url.startsWith(portalOrigin)) return true;
        if (/^https?:\/\//i.test(request.url)) void Linking.openURL(request.url);
        return false;
      }}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as { type?: string };
          if (message.type === 'SIGNED_OUT' || message.type === 'SESSION_EXPIRED') void signOut();
          if ((message.type === 'PUNCH_IN' || message.type === 'PUNCH_OUT') && user?.role === 'agent') {
            void reconcileBackgroundTracking(user.id, message.type === 'PUNCH_IN');
          }
          if (message.type === 'HANDOFF_FAILED') setError('Secure portal sign-in failed. Tap retry to create a new session.');
        } catch { /* Ignore messages not owned by the Reproutes bridge. */ }
      }}
      onNavigationStateChange={onNavigation}
      onLoadStart={() => { setLoading(true); setError(''); }}
      onLoadEnd={() => setLoading(false)}
      onError={(event) => { setLoading(false); setError(event.nativeEvent.description || 'Portal unavailable'); }}
      onHttpError={(event) => { setLoading(false); setError(`Portal request failed (${event.nativeEvent.statusCode}). Tap Retry.`); }}
      style={styles.web}
    /> : null}
    {loading ? <View style={styles.overlay}><ActivityIndicator size="large" color="#06b6d4"/><Text style={styles.loading}>Loading Reproutes portal…</Text></View> : null}
    {error ? <View style={styles.error}><Text style={styles.errorTitle}>Unable to open Reproutes</Text><Text style={styles.errorText}>{error}</Text><Text style={styles.hint}>Check your internet connection and hosted service status.</Text><Pressable style={styles.retry} onPress={() => void openPortal()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},web:{flex:1,backgroundColor:'#fff'},overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',gap:14},loading:{color:'#475569',fontWeight:'700'},error:{...StyleSheet.absoluteFillObject,backgroundColor:'#f8fafc',alignItems:'center',justifyContent:'center',padding:28,gap:10},errorTitle:{fontSize:22,fontWeight:'900',color:'#0f172a'},errorText:{color:'#be123c',textAlign:'center'},hint:{color:'#64748b',textAlign:'center',lineHeight:20},retry:{marginTop:10,backgroundColor:'#2563eb',paddingHorizontal:26,paddingVertical:13,borderRadius:13},retryText:{color:'#fff',fontWeight:'900'}
});
