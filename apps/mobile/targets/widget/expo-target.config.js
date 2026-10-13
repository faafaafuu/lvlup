// Виджеты и Live Activity (Dynamic Island) Хрума — SwiftUI-расширение, собирается при prebuild.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'HrumWidget',
  displayName: 'Хрум',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
  colors: { $accent: '#E8202A', $widgetBackground: '#0A0A0C' },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
