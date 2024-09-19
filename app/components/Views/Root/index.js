import React, { PureComponent } from 'react';
import SplashScreen from '@metamask/react-native-splash-screen';
import PropTypes from 'prop-types';
import App from '../../Nav/App';
import SecureKeychain from '../../../core/SecureKeychain';
import EntryScriptWeb3 from '../../../core/EntryScriptWeb3';
import Logger from '../../../util/Logger';
import ErrorBoundary from '../ErrorBoundary';
import { useAppTheme, ThemeContext } from '../../../util/theme';
import { ToastContextWrapper } from '../../../component-library/components/Toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isTest } from '../../../util/test/utils';
import { View } from 'react-native';
import EngineService from '../../../core/EngineService';

/**
 * Top level of the component hierarchy
 * App component is wrapped by the provider from react-redux
 */
export default class Root extends PureComponent {
  static propTypes = {
    foxCode: PropTypes.string,
  };

  static defaultProps = {
    foxCode: 'null',
  };

  constructor(props) {
    super(props);
    if (props.foxCode === '') {
      const foxCodeError = new Error('WARN - foxCode is an empty string');
      Logger.error(foxCodeError);
    }
    // SecureKeychain.init(props.foxCode);
    // Init EntryScriptWeb3 asynchronously on the background
    // EntryScriptWeb3.init();
  }

  render() {
    SplashScreen.hide();
    EngineService.initalizeEngine();
    return <View style={{ flex: 1, backgroundColor: 'red' }} />;
  }
}

const ConnectedRoot = () => {
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <ToastContextWrapper>
          <ErrorBoundary view="Root">
            <App />
          </ErrorBoundary>
        </ToastContextWrapper>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
};
