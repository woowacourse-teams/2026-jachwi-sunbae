package kr.jachwisunbae.webviewshell;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// mobile/App.tsx 의 <WebView> 와 react-native-webview 14 의 Android 기본 설정을 옮긴 셸이다.
// 주소는 측정 스크립트(measure-android.mjs)가 CDP로 연다. 처음에는 빈 페이지만 띄운다.
public class MainActivity extends Activity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);
    WebView webView = new WebView(this);
    WebSettings settings = webView.getSettings();
    // react-native-webview 기본값
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setBuiltInZoomControls(true);
    settings.setDisplayZoomControls(false);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setMediaPlaybackRequiresUserGesture(true);
    // App.tsx 의 props: geolocationEnabled, setSupportMultipleWindows={false}, thirdPartyCookiesEnabled={false},
    // applicationNameForUserAgent={`JachwiSunbae/${appVersion} ${Platform.OS}`}
    settings.setGeolocationEnabled(true);
    settings.setSupportMultipleWindows(false);
    CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
    String appVersion = getIntent().getStringExtra("appVersion");
    settings.setUserAgentString(
        WebSettings.getDefaultUserAgent(this) + " JachwiSunbae/" + (appVersion == null ? "0.0.0" : appVersion) + " android");
    webView.setWebViewClient(new WebViewClient());
    // react-native-webview 의 RNCWebChromeClient 처럼, 앱에 위치 권한이 있으면 웹의 위치 요청을 허용한다.
    // 실제 앱은 권한이 없으면 OS 권한 대화상자를 띄운다. 셸은 대화상자를 띄우지 않고, 측정 스크립트가 pm grant 와 pm revoke 로
    // 허용과 거부를 정한다. 그래서 셸의 거부는 "대화상자에서 거부를 누른 뒤"와 같은 상태만 재현한다.
    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        boolean granted = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        callback.invoke(origin, granted, false);
      }
    });
    setContentView(webView);
    webView.loadUrl("about:blank");
  }
}
