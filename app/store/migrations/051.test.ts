import migration from './051';
import { merge } from 'lodash';
import initialRootState from '../../util/test/initial-root-state';
import { captureException } from '@sentry/react-native';
import {
  expectedUuid,
  expectedUuid2,
  internalAccount1,
  internalAccount2,
} from '../../util/test/accountsControllerTestUtils';
import { RootState } from '../../reducers';

const oldState = {
  engine: {
    backgroundState: {
      AccountsController: {
        internalAccounts: {
          accounts: {
            [expectedUuid]: internalAccount1,
            [expectedUuid2]: internalAccount2,
          },
          selectedAccount: expectedUuid,
        },
      },
    },
  },
};

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #51', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const invalidStates = [
    {
      state: merge({}, initialRootState, {
        engine: null,
      }),
      errorMessage:
        "FATAL ERROR: Migration 51: Invalid engine state error: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: null,
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 51: Invalid engine backgroundState error: 'object'",
      scenario: 'backgroundState is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            AccountsController: null,
          },
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 51: Invalid AccountsController state error: 'object'",
      scenario: 'AccountsController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            AccountsController: { internalAccounts: null },
          },
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 51: Invalid AccountsController internalAccounts state error: 'object'",
      scenario: 'AccountsController internalAccounts state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            AccountsController: {
              internalAccounts: {
                accounts: null,
              },
            },
          },
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 51: Invalid AccountsController internalAccounts accounts state error: 'object'",
      scenario: 'AccountsController internalAccounts accounts state is invalid',
    },
  ];

  for (const { errorMessage, scenario, state } of invalidStates) {
    it(`should capture exception if ${scenario}`, () => {
      const newState = migration(state);

      expect(newState).toStrictEqual(state);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('should not change selectedAccount if it is valid', () => {
    const newState: Pick<RootState, 'engine'> = migration(oldState) as Pick<
      RootState,
      'engine'
    >;

    expect(
      newState.engine.backgroundState.AccountsController.internalAccounts
        .selectedAccount,
    ).toEqual(expectedUuid);
  });

  it('should update selectedAccount if it is invalid', () => {
    const invalidState = merge({}, oldState, {
      engine: {
        backgroundState: {
          AccountsController: {
            internalAccounts: {
              selectedAccount: 'invalid-uuid',
            },
          },
        },
      },
    });

    const newState: Pick<RootState, 'engine'> = migration(invalidState) as Pick<
      RootState,
      'engine'
    >;

    expect(
      newState.engine.backgroundState.AccountsController.internalAccounts
        .selectedAccount,
    ).toEqual(expectedUuid);
  });

  it('should not change state if there are no accounts', () => {
    const emptyAccountsState = merge({}, oldState, {
      engine: {
        backgroundState: {
          AccountsController: {
            internalAccounts: {
              accounts: {},
              selectedAccount: 'some-uuid',
            },
          },
        },
      },
    });

    const newState: Pick<RootState, 'engine'> = migration(
      emptyAccountsState,
    ) as Pick<RootState, 'engine'>;

    expect(newState).toStrictEqual(emptyAccountsState);
  });
});
