import TestHelpers from '../../helpers';
import messages from '../../../locales/languages/en.json';
import { NETWORK_AVATAR_IMAGE_ID } from '../../../app/constants/test-ids';
import { MULTI_TAB_ADD_BUTTON } from '../../../wdio/screen-objects/testIDs/BrowserScreen/MultiTab.testIds';
import {
  BROWSER_SCREEN_ID,
  HOME_BUTTON,
  TABS_BUTTON,
  BACK_BUTTON,
  OPTIONS_BUTTON,
  SEARCH_BUTTON,
  NAVBAR_TITLE_NETWORK,
} from '../../../wdio/screen-objects/testIDs/BrowserScreen/BrowserScreen.testIds';
import { URL_INPUT_BOX_ID } from '../../../wdio/screen-objects/testIDs/BrowserScreen/AddressBar.testIds';
import {
  ADD_BOOKMARKS_SCREEN_ID,
  ADD_BOOKMARKS_BUTTON_ID,
} from '../../../wdio/screen-objects/testIDs/BrowserScreen/AddFavorite.testIds';
import { NOTIFICATION_TITLE } from '../../../wdio/screen-objects/testIDs/Components/Notification.testIds';
import {
  testDappConnectButtonCooridinates,
  testDappSendEIP1559ButtonCoordinates,
} from '../../viewHelper';

const ANDROID_BROWSER_WEBVIEW_ID = 'browser-webview';
const RETURN_HOME_TEXT = messages.webview_error.return_home;
const BACK_TO_SAFETY_TEXT = messages.phishing.back_to_safety;
const REVOKE_ALL_ACCOUNTS_TEXT = messages.toast.revoked_all;
const CONNECTED_ACCOUNTS_TEXT = messages.toast.connected_and_active;
const TEST_DAPP = 'https://metamask.github.io/test-dapp/';

export default class Browser {
  static async tapUrlInputBox() {
    await TestHelpers.waitAndTap(NAVBAR_TITLE_NETWORK);
    await TestHelpers.delay(1000);
  }

  static async tapBottomSearchBar() {
    await TestHelpers.waitAndTap(SEARCH_BUTTON);
  }

  static async tapOptionsButton() {
    await TestHelpers.waitAndTap(OPTIONS_BUTTON);
  }

  static async tapOpenAllTabsButton() {
    await TestHelpers.waitAndTap(TABS_BUTTON);
  }

  static async tapOpenNewTabButton() {
    await TestHelpers.tap(MULTI_TAB_ADD_BUTTON);
  }
  static async tapNetworkAvatarButtonOnBrowser() {
    if (device.getPlatform() === 'android') {
      await TestHelpers.waitAndTapByLabel(NETWORK_AVATAR_IMAGE_ID);
    } else {
      await TestHelpers.waitAndTap(NETWORK_AVATAR_IMAGE_ID);
    }
  }

  static async tapNetworkAvatarButtonOnBrowserWhileAccountIsConnectedToDapp() {
    if (device.getPlatform() === 'android') {
      await TestHelpers.delay(3000); // to wait until toast notifcation disappears
      await TestHelpers.tapByDescendentTestID(
        'navbar-account-button',
        'badge-wrapper-badge',
      ); // these needs to be assigned to a variable.
    } else {
      await TestHelpers.waitAndTap(NETWORK_AVATAR_IMAGE_ID);
    }
  }

  static async tapAddToFavoritesButton() {
    await TestHelpers.tapByText('Add to Favorites');
  }

  static async tapAddBookmarksButton() {
    if (device.getPlatform() === 'android') {
      await TestHelpers.waitAndTapByLabel(ADD_BOOKMARKS_BUTTON_ID);
    } else {
      await TestHelpers.waitAndTap(ADD_BOOKMARKS_BUTTON_ID);
    }

    // await TestHelpers.tap(ADD_BOOKMARKS_BUTTON_ID);
  }
  static async tapHomeButton() {
    await TestHelpers.tap(HOME_BUTTON);
  }

  static async tapBackToSafetyButton() {
    await TestHelpers.tapByText(BACK_TO_SAFETY_TEXT);
  }
  static async tapReturnHomeButton() {
    await TestHelpers.tapByText(RETURN_HOME_TEXT);
  }
  static async tapBrowserBackButton() {
    // This action is android specific
    await TestHelpers.tap(BACK_BUTTON);
  }

  static async navigateToURL(url) {
    if (device.getPlatform() === 'ios') {
      await TestHelpers.clearField(URL_INPUT_BOX_ID);
      await TestHelpers.typeTextAndHideKeyboard(URL_INPUT_BOX_ID, url);
      await TestHelpers.delay(2000);
    } else {
      await TestHelpers.clearField(URL_INPUT_BOX_ID);
      await TestHelpers.replaceTextInField(URL_INPUT_BOX_ID, url);
      await element(by.id(URL_INPUT_BOX_ID)).tapReturnKey();
    }
  }
  static async scrollToTakeTourOnBrowserPage() {
    // Scroll on browser to show tutorial box and tap to skip
    if (device.getPlatform() === 'ios') {
      await TestHelpers.swipe(BROWSER_SCREEN_ID, 'up');
    } else {
      await TestHelpers.checkIfExists(ANDROID_BROWSER_WEBVIEW_ID);
      await TestHelpers.swipe(ANDROID_BROWSER_WEBVIEW_ID, 'up');
      await TestHelpers.delay(1000);
    }
  }

  static async goToTestDappAndTapConnectButton() {
    await TestHelpers.delay(3000);
    await this.tapUrlInputBox();
    await this.navigateToURL(TEST_DAPP);
    await TestHelpers.delay(3000);
    if (device.getPlatform() === 'ios') {
      await TestHelpers.tapAtPoint(
        BROWSER_SCREEN_ID,
        testDappConnectButtonCooridinates,
      );
    } else {
      await this.tapConnectButton();
    }
  }

  static async tapConnectButton() {
    const connectButtonID = 'connectButton';

    if (device.getPlatform === 'android') {
      await web.element(by.web.id(connectButtonID)).tap();
    } else {
      await TestHelpers.tapAtPoint(
        BROWSER_SCREEN_ID,
        testDappConnectButtonCooridinates,
      );
    }
  }
  static async tapSendEIP1559() {
    // this method only works for android // at this moment in time only android supports interacting with webviews:https://wix.github.io/Detox/docs/api/webviews
    const EIP1559ButtonID = 'sendEIP1559Button';

    if (device.getPlatform() === 'android') {
      await TestHelpers.swipe(BROWSER_SCREEN_ID, 'up', 'slow', 0.5);
      await TestHelpers.delay(1500);
      await web.element(by.web.id(EIP1559ButtonID)).tap();
    } else {
      await TestHelpers.swipe(BROWSER_SCREEN_ID, 'up', 'slow', 0.1); // scrolling to the SendEIP1559 button
      await TestHelpers.tapAtPoint(
        BROWSER_SCREEN_ID,
        testDappSendEIP1559ButtonCoordinates,
      );
    }
    await TestHelpers.tapByText('Confirm', 1);
  }
  static async waitForBrowserPageToLoad() {
    await TestHelpers.delay(5000);
  }

  static async isVisible() {
    await TestHelpers.checkIfVisible(BROWSER_SCREEN_ID);
  }

  static async isNotVisible() {
    await TestHelpers.checkIfNotVisible(BROWSER_SCREEN_ID);
  }

  static async isAddBookmarkScreenVisible() {
    await TestHelpers.checkIfVisible(ADD_BOOKMARKS_SCREEN_ID);
  }

  static async isAddBookmarkScreenNotVisible() {
    await TestHelpers.checkIfNotVisible(ADD_BOOKMARKS_SCREEN_ID);
  }

  static async isBrowserFavoriteVisible(browserFavoriteName) {
    await TestHelpers.checkIfElementWithTextIsVisible(browserFavoriteName);
  }

  static async isBackToSafetyButtonVisible() {
    await TestHelpers.checkIfElementWithTextIsVisible('Back to safety');
  }
  static async isAccountToastVisible(accountName) {
    const connectedAccountMessage = `${accountName} ${CONNECTED_ACCOUNTS_TEXT}`;
    await TestHelpers.checkIfElementHasString(
      NOTIFICATION_TITLE,
      connectedAccountMessage,
    );
  }

  static async isRevokeAllAccountToastVisible() {
    await TestHelpers.checkIfElementHasString(
      NOTIFICATION_TITLE,
      REVOKE_ALL_ACCOUNTS_TEXT,
    );
  }
}
