import 'react-native-gesture-handler/jestSetup';

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