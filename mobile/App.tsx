import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { version as appVersion } from './package.json';
import { WEB_APP_URL } from './src/config';
import { isAllowedWebAppUrl, toWebAppUrl } from './src/navigationPolicy';
import NativeTabBar, { MAIN_TABS } from './src/NativeTabBar';
import {
  createNativeContextScript,
  createSelectTabScript,
  createTabBarHeightScript,
  parseWebMessage,
} from './src/webBridge';

const DEFAULT_NATIVE_TAB_BAR_HEIGHT = 49;
const NATIVE_FEATURES = Platform.OS === 'ios' ? (['tab-bar'] as const) : ([] as const);

type ErrorViewProps = {
  onRetry: () => void;
};

const ErrorView = ({ onRetry }: ErrorViewProps) => (
  <View style={styles.stateContainer} accessibilityRole="alert">
    <Text style={styles.stateSymbol}>!</Text>
    <Text style={styles.stateTitle}>화면을 불러오지 못했어요</Text>
    <Text style={styles.stateDescription}>인터넷 연결을 확인한 뒤 다시 시도해 주세요.</Text>
    <Pressable
      accessibilityRole="button"
      onPress={onRetry}
      style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
    >
      <Text style={styles.retryButtonText}>다시 시도</Text>
    </Pressable>
  </View>
);

const LoadingView = () => (
  <View style={styles.stateContainer}>
    <ActivityIndicator color="#333333" size="large" />
    <Text style={styles.loadingText}>자취선배를 불러오는 중이에요</Text>
  </View>
);

const AppContent = () => {
  const webViewRef = useRef<WebView<object>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [appUrl, setAppUrl] = useState(WEB_APP_URL);
  const [nativeTabBarVisible, setNativeTabBarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [nativeTabBarHeight, setNativeTabBarHeight] = useState(DEFAULT_NATIVE_TAB_BAR_HEIGHT);

  const openDeepLink = useCallback((url: string) => {
    const nextUrl = toWebAppUrl(url);
    if (nextUrl !== null) {
      setFailed(false);
      setAppUrl(nextUrl);
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url !== null && url !== undefined) openDeepLink(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => openDeepLink(url));
    return () => subscription.remove();
  }, [openDeepLink]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const retry = () => {
    setFailed(false);
    setNativeTabBarVisible(false);
    setActiveTab(null);
    setReloadKey((current) => current + 1);
  };

  const handleWebMessage = useCallback((event: WebViewMessageEvent) => {
    const route = parseWebMessage(event.nativeEvent.data);
    if (route === null) return;
    setNativeTabBarVisible(route.isTabBarVisible);
    setActiveTab(route.activeTab);
  }, []);

  const handleNativeTabSelect = useCallback((event: NativeSyntheticEvent<{ key: string }>) => {
    webViewRef.current?.injectJavaScript(createSelectTabScript(event.nativeEvent.key));
  }, []);

  const handleNativeTabBarMeasure = useCallback((event: NativeSyntheticEvent<{ height: number }>) => {
    const height = Number(event.nativeEvent.height);
    if (Number.isFinite(height) && height > 0) {
      const roundedHeight = Math.round(height);
      setNativeTabBarHeight(roundedHeight);
      webViewRef.current?.injectJavaScript(createTabBarHeightScript(roundedHeight));
    }
  }, []);

  const handleWebViewLoadEnd = useCallback(() => {
    if (Platform.OS === 'ios') {
      webViewRef.current?.injectJavaScript(createTabBarHeightScript(nativeTabBarHeight));
    }
  }, [nativeTabBarHeight]);

  const shouldStartLoad = (request: WebViewNavigation) => {
    if (isAllowedWebAppUrl(request.url)) return true;

    Linking.openURL(request.url).catch(() => {
      setFailed(true);
    });
    return false;
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {failed ? (
        <ErrorView onRetry={retry} />
      ) : (
        <>
          <WebView<object>
            key={reloadKey}
            ref={webViewRef}
            source={{ uri: appUrl }}
            originWhitelist={['https://*', 'about:blank']}
            injectedJavaScriptBeforeContentLoaded={createNativeContextScript(Platform.OS, NATIVE_FEATURES)}
            onMessage={handleWebMessage}
            onShouldStartLoadWithRequest={shouldStartLoad}
            onNavigationStateChange={({ canGoBack: nextCanGoBack }) => setCanGoBack(nextCanGoBack)}
            onLoadEnd={handleWebViewLoadEnd}
            onError={() => setFailed(true)}
            onContentProcessDidTerminate={() => webViewRef.current?.reload()}
            renderLoading={LoadingView}
            startInLoadingState
            allowsBackForwardNavigationGestures
            allowsInlineMediaPlayback
            applicationNameForUserAgent={`JachwiSunbae/${appVersion} ${Platform.OS}`}
            automaticallyAdjustContentInsets={false}
            bounces={false}
            contentInsetAdjustmentBehavior="never"
            geolocationEnabled
            keyboardDisplayRequiresUserAction={false}
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={false}
            setSupportMultipleWindows={false}
            style={styles.webView}
          />
          {Platform.OS === 'ios' && nativeTabBarVisible && (
            <NativeTabBar
              items={MAIN_TABS}
              selectedKey={activeTab}
              onSelectTab={handleNativeTabSelect}
              onMeasure={handleNativeTabBarMeasure}
              style={[styles.nativeTabBar, { height: nativeTabBarHeight }]}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const App = () => (
  <SafeAreaProvider>
    <AppContent />
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  webView: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  nativeTabBar: {
    flexShrink: 0,
    width: '100%',
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateSymbol: {
    backgroundColor: '#f5b91e',
    borderRadius: 28,
    color: '#111111',
    fontSize: 28,
    fontWeight: '800',
    height: 56,
    lineHeight: 56,
    marginBottom: 20,
    overflow: 'hidden',
    textAlign: 'center',
    width: 56,
  },
  stateTitle: {
    color: '#212124',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  stateDescription: {
    color: '#5f6368',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  loadingText: {
    color: '#5f6368',
    fontSize: 15,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#333333',
    borderRadius: 12,
    marginTop: 24,
    minWidth: 132,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryButtonPressed: {
    backgroundColor: '#222222',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default App;
