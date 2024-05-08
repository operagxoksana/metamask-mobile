import { Hex } from '@metamask/utils';
import { renderHook } from '@testing-library/react-hooks';
import { BigNumber } from 'bignumber.js';

import { getTokenDetails } from '../../../util/address';
import useBalanceChanges from './useBalanceChanges';
import { AssetType, SimulationData, SimulationTokenStandard } from './types';

jest.mock('../../../util/address', () => ({
  getTokenDetails: jest.fn(),
}));

const mockGetTokenDetails = getTokenDetails as jest.Mock;

const ERC20_TOKEN_ADDRESS_1_MOCK: Hex = '0x0erc20_1';
const ERC20_TOKEN_ADDRESS_2_MOCK: Hex = '0x0erc20_2';
const ERC20_DECIMALS_1_MOCK = 3;
const ERC20_DECIMALS_2_MOCK = 4;

const NFT_TOKEN_ADDRESS_MOCK: Hex = '0x0nft';

const TOKEN_ID_1_MOCK: Hex = '0x123';

const DIFFERENCE_1_MOCK: Hex = '0x11';
const DIFFERENCE_2_MOCK: Hex = '0x2';
const DIFFERENCE_ETH_MOCK: Hex = '0x1234567890123456789';

const dummyBalanceChange = {
  previousBalance: '0xIGNORE' as Hex,
  newBalance: '0xIGNORE' as Hex,
};

const PENDING_PROMISE = () =>
  new Promise(() => {
    /* unresolved promise */
  });

describe('useBalanceChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenDetails.mockImplementation((address: Hex) => {
      const decimalMap: Record<Hex, number> = {
        [ERC20_TOKEN_ADDRESS_1_MOCK]: ERC20_DECIMALS_1_MOCK,
        [ERC20_TOKEN_ADDRESS_2_MOCK]: ERC20_DECIMALS_2_MOCK,
      };
      if (decimalMap[address]) {
        return Promise.resolve({
          decimals: decimalMap[address]?.toString() ?? undefined,
        });
      }
      return Promise.reject(new Error('Unable to determine token standard'));
    });
  });

  describe('pending states', () => {
    it('returns pending=true if no simulation data', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBalanceChanges(undefined),
      );
      expect(result.current).toEqual({ pending: true, value: [] });
      await waitForNextUpdate();
    });

    it('returns pending=true while fetching token decimals', async () => {
      mockGetTokenDetails.mockImplementation(PENDING_PROMISE);
      const simulationData: SimulationData = {
        nativeBalanceChange: undefined,
        tokenBalanceChanges: [
          {
            ...dummyBalanceChange,
            difference: DIFFERENCE_1_MOCK,
            isDecrease: true,
            address: ERC20_TOKEN_ADDRESS_1_MOCK,
            standard: SimulationTokenStandard.erc20,
          },
        ],
      };
      const { result, unmount } = renderHook(() =>
        useBalanceChanges(simulationData),
      );

      expect(result.current).toEqual({ pending: true, value: [] });
      unmount();
    });
  });

  describe('with token balance changes', () => {
    const setupHook = (
      tokenBalanceChanges: SimulationData['tokenBalanceChanges'],
    ) => {
      const simulationData: SimulationData = {
        nativeBalanceChange: undefined,
        tokenBalanceChanges,
      };
      return renderHook(() => useBalanceChanges(simulationData));
    };

    it('maps token balance changes correctly', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: '0x11',
          isDecrease: true,
          address: ERC20_TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      const changes = result.current.value;
      expect(changes).toEqual([
        {
          asset: {
            address: ERC20_TOKEN_ADDRESS_1_MOCK,
            type: AssetType.ERC20,
            tokenId: undefined,
          },
          amount: new BigNumber('-0.017'),
        },
      ]);
      expect(changes[0].amount.toString()).toBe('-0.017');
    });

    it('handles multiple token balance changes', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1_MOCK,
          isDecrease: true,
          address: ERC20_TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_2_MOCK,
          isDecrease: false,
          address: ERC20_TOKEN_ADDRESS_2_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      const changes = result.current.value;
      expect(changes).toHaveLength(2);
      expect(changes[0].amount.toString()).toBe('-0.017');
      expect(changes[1].amount.toString()).toBe('0.0002');
    });

    it('handles non-ERC20 tokens', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: '0x1',
          isDecrease: true,
          address: NFT_TOKEN_ADDRESS_MOCK,
          standard: SimulationTokenStandard.erc721,
          id: TOKEN_ID_1_MOCK,
        },
      ]);

      await waitForNextUpdate();

      expect(result.current.value).toEqual([
        {
          asset: {
            address: NFT_TOKEN_ADDRESS_MOCK,
            type: AssetType.ERC721,
            tokenId: TOKEN_ID_1_MOCK,
          },
          amount: new BigNumber('-1'),
        },
      ]);
    });

    it('uses default decimals when token details not found', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1_MOCK,
          isDecrease: true,
          address: '0x0unknown',
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      expect(result.current.value[0].amount.decimalPlaces()).toBe(18);
    });
  });

  describe('with native balance change', () => {
    const setupHook = (
      nativeBalanceChange?: SimulationData['nativeBalanceChange'],
    ) => {
      const simulationData: SimulationData = {
        nativeBalanceChange,
        tokenBalanceChanges: [],
      };
      return renderHook(() => useBalanceChanges(simulationData));
    };

    it('maps native balance change correctly', async () => {
      const { result, waitForNextUpdate } = setupHook({
        ...dummyBalanceChange,
        difference: DIFFERENCE_ETH_MOCK,
        isDecrease: true,
      });

      await waitForNextUpdate();

      const changes = result.current.value;
      expect(changes).toEqual([
        {
          asset: {
            type: AssetType.Native,
          },
          amount: new BigNumber('-5373.003641998677469065'),
        },
      ]);
    });

    it('handles no native balance change', async () => {
      const { result, waitForNextUpdate } = setupHook(undefined);
      await waitForNextUpdate();
      expect(result.current.value).toEqual([]);
    });
  });

  it('combines native and token balance changes', async () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...dummyBalanceChange,
        difference: DIFFERENCE_ETH_MOCK,
        isDecrease: true,
      },
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_2_MOCK,
          isDecrease: false,
          address: ERC20_TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ],
    };
    const { result, waitForNextUpdate } = renderHook(() =>
      useBalanceChanges(simulationData),
    );

    await waitForNextUpdate();

    const changes = result.current.value;
    expect(changes).toHaveLength(2);
    expect(changes[0].asset).toEqual({
      type: AssetType.Native,
    });
    expect(changes[0].amount).toEqual(
      new BigNumber('-5373.003641998677469065'),
    );
    expect(changes[1].asset).toEqual({
      address: ERC20_TOKEN_ADDRESS_1_MOCK,
      type: AssetType.ERC20,
    });
    expect(changes[1].amount).toEqual(new BigNumber('0.002'));
  });
});
