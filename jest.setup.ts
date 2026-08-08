import 'react-native-gesture-handler/jestSetup';

// Reanimated v4 depends on react-native-worklets at runtime. Its mock is not
// exposed as a package subpath, so require it from lib/module directly.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native-safe-area-context');

  const MOCK_INITIAL_METRICS = {
    frame: { width: 320, height: 640, x: 0, y: 0 },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  const SafeAreaProvider = ({ children, initialMetrics }: any) =>
    React.createElement(
      actual.SafeAreaFrameContext.Provider,
      { value: initialMetrics?.frame ?? MOCK_INITIAL_METRICS.frame },
      React.createElement(
        actual.SafeAreaInsetsContext.Provider,
        { value: initialMetrics?.insets ?? MOCK_INITIAL_METRICS.insets },
        children,
      ),
    );

  return {
    ...actual,
    SafeAreaProvider,
    SafeAreaProviderCompat: SafeAreaProvider,
    initialWindowMetrics: MOCK_INITIAL_METRICS,
    useSafeAreaInsets: actual.useSafeAreaInsets,
    useSafeAreaFrame: actual.useSafeAreaFrame,
  };
});