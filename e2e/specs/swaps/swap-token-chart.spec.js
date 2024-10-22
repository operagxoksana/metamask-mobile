'use strict';
import { ethers } from 'ethers';
import { loginToApp } from '../../viewHelper';
import Onboarding from '../../pages/swaps/OnBoarding';
import QuoteView from '../../pages/swaps/QuoteView';
import SwapView from '../../pages/swaps/SwapView';
import TabBarComponent from '../../pages/TabBarComponent';
import WalletView from '../../pages/wallet/WalletView';
import TokenOverview from '../../pages/TokenOverview';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../../fixtures/fixture-helper';
import { CustomNetworks } from '../../resources/networks.e2e';
import TestHelpers from '../../helpers';
import FixtureServer from '../../fixtures/fixture-server';
import { getFixturesServerPort } from '../../fixtures/utils';
import { Regression } from '../../tags';
import AccountListView from '../../pages/AccountListView';
import ImportAccountView from '../../pages/importAccount/ImportAccountView';
import CommonView from '../../pages/CommonView';
import SuccessImportAccountView from '../../pages/importAccount/SuccessImportAccountView';
import Assertions from '../../utils/Assertions';
import AddAccountModal from '../../pages/modals/AddAccountModal';
import ActivitiesView from '../../pages/ActivitiesView';
import { ActivitiesViewSelectorsText } from '../../selectors/ActivitiesView.selectors';
import Tenderly from '../../tenderly';

const fixtureServer = new FixtureServer();

describe(Regression('Swap from Token view'), () => {
  const swapOnboarded = true; // TODO: Set it to false once we show the onboarding page again.
  const wallet = ethers.Wallet.createRandom();

  beforeAll(async () => {
    await Tenderly.addFunds( CustomNetworks.Tenderly.Mainnet.providerConfig.rpcUrl, wallet.address);
    await TestHelpers.reverseServerPort();
    const fixture = new FixtureBuilder()
      .withNetworkController(CustomNetworks.Tenderly.Mainnet)
      .build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await device.launchApp({
      permissions: { notifications: 'YES' },
      launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
    });
    await loginToApp();
  });

  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  beforeEach(async () => {
    jest.setTimeout(150000);
  });

  it('should be able to import account', async () => {
    await WalletView.tapIdenticon();
    await Assertions.checkIfVisible(AccountListView.accountList);
    await AccountListView.tapAddAccountButton();
    await AddAccountModal.tapImportAccount();
    await Assertions.checkIfVisible(ImportAccountView.container);
    // Tap on import button to make sure alert pops up
    await ImportAccountView.tapImportButton();
    await CommonView.tapOKAlertButton();
    await ImportAccountView.enterPrivateKey(wallet.privateKey);
    await Assertions.checkIfVisible(SuccessImportAccountView.container);
    await SuccessImportAccountView.tapCloseButton();
    await AccountListView.swipeToDismissAccountsModal();
    await Assertions.checkIfVisible(WalletView.container);
  });

  it('should complete a USDC to DAI swap from the token chart', async () => {
    await TabBarComponent.tapWallet();
    await Assertions.checkIfVisible(WalletView.container);
    await WalletView.tapOnToken('Ethereum');
    await Assertions.checkIfVisible(TokenOverview.container);
    await TokenOverview.scrollOnScreen();
    await TokenOverview.tapSwapButton();
    if (!swapOnboarded) await Onboarding.tapStartSwapping();
    await Assertions.checkIfVisible(QuoteView.getQuotes);
    await QuoteView.enterSwapAmount('.5');
    await QuoteView.tapOnSelectDestToken();
    await QuoteView.tapSearchToken();
    await QuoteView.typeSearchToken('DAI');
    await TestHelpers.delay(1000);
    await QuoteView.selectToken('DAI');
    await QuoteView.tapOnGetQuotes();
    await Assertions.checkIfVisible(SwapView.fetchingQuotes);
    await Assertions.checkIfVisible(SwapView.quoteSummary);
    await Assertions.checkIfVisible(SwapView.gasFee);
    await SwapView.tapIUnderstandPriceWarning();
    await SwapView.swipeToSwap();
    //Wait for Swap to complete
    await SwapView.swapCompleteLabel('ETH', 'DAI');
    await device.enableSynchronization();
    await TestHelpers.delay(5000);
    await TokenOverview.isVisible();
    await TokenOverview.tapBackButton();

    // Check the swap activity completed
    await TabBarComponent.tapActivity();
    await Assertions.checkIfVisible(ActivitiesView.title);
    await Assertions.checkIfVisible(
      ActivitiesView.swapActivity(sourceTokenSymbol, destTokenSymbol),
    );gi
    await ActivitiesView.tapOnSwapActivity(sourceTokenSymbol, destTokenSymbol);

    try {
      await Assertions.checkIfVisible(DetailsBottomSheet.title);
    } catch (e) {
      await ActivitiesView.tapOnSwapActivity(
        sourceTokenSymbol,
        destTokenSymbol,
      );
      await Assertions.checkIfVisible(DetailsBottomSheet.title);
    }

    await Assertions.checkIfVisible(DetailsBottomSheet.title);
    await Assertions.checkIfElementToHaveText(
      DetailsBottomSheet.title,
      DetailsBottomSheet.generateExpectedTitle(sourceTokenSymbol, destTokenSymbol),
    );
    await Assertions.checkIfVisible(DetailsBottomSheet.statusConfirmed);
    await DetailsBottomSheet.tapOnCloseIcon();
    await Assertions.checkIfNotVisible(DetailsBottomSheet.title);
  });
});
