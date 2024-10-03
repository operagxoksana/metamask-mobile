import React from 'react';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import StakeReviewView from './StakeReviewView';
import { Image } from 'react-native';
import { createMockAccountsControllerState } from '../../../../../util/test/accountsControllerTestUtils';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { StakeReviewViewProps } from './StakeReviewView.types';

jest.mock('../../../../hooks/useIpfsGateway', () => jest.fn());

Image.getSize = jest.fn((_uri, success) => {
  success(100, 100); // Mock successful response for ETH native Icon Image
});

const MOCK_ADDRESS_1 = '0x0';
const MOCK_ADDRESS_2 = '0x1';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
]);

const mockStore = configureMockStore();

const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};
const store = mockStore(mockInitialState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest
    .fn()
    .mockImplementation((callback) => callback(mockInitialState)),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
    }),
  };
});

describe('StakeReviewView', () => {
  it('render matches snapshot', () => {
    const props: StakeReviewViewProps = {
      route: {
        key: '1',
        params: { wei: '3210000000000000', fiat: '7.46' },
        name: 'params',
      },
    };

    const { toJSON } = renderWithProvider(
      <Provider store={store}>
        <StakeReviewView {...props} />
      </Provider>,
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
