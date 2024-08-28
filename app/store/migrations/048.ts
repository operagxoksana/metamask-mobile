import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Migration to remove contractExchangeRates and contractExchangeRatesByChainId from the state of TokenRatesController
 *
 * @param state Persisted Redux state
 * @returns Updated state if changes were made, otherwise the original state
 */
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 48)) {
    return state;
  }

  const tokenRatesControllerState =
    state.engine.backgroundState.TokenRatesController;

  if (!isObject(tokenRatesControllerState)) {
    captureException(
      new Error(
        `FATAL ERROR: Migration 48: Invalid TokenRatesController state error: '${typeof tokenRatesControllerState}'`,
      ),
    );
    return state;
  }

  const updatedTokenRatesControllerState = { ...tokenRatesControllerState };
  let stateChanged = false;

  if ('contractExchangeRates' in updatedTokenRatesControllerState) {
    delete updatedTokenRatesControllerState.contractExchangeRates;
    stateChanged = true;
  }

  if ('contractExchangeRatesByChainId' in updatedTokenRatesControllerState) {
    delete updatedTokenRatesControllerState.contractExchangeRatesByChainId;
    stateChanged = true;
  }

  if (!stateChanged) {
    return state; // No changes were made, return original state
  }

  // Add a timestamp to mark when the migration occurred
  updatedTokenRatesControllerState.migrationTimestamp = Date.now();

  // Add a migration version to further differentiate the state
  updatedTokenRatesControllerState.migrationVersion = '48.1';

  // Return a new state object with the updated TokenRatesController
  return {
    ...state,
    engine: {
      ...state.engine,
      backgroundState: {
        ...state.engine.backgroundState,
        TokenRatesController: updatedTokenRatesControllerState,
      },
    },
  };
}
