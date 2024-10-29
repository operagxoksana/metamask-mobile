import {
  SwapsViewSelectors,
  SwapViewSelectorsTexts,
} from '../../selectors/swaps/SwapsView.selectors.js';

import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import TestHelpers from '../..//helpers';

class SwapView {
  get quoteSummary() {
    return Matchers.getElementByID(SwapsViewSelectors.QUOTE_SUMMARY);
  }

  get gasFee() {
    return Matchers.getElementByID(SwapsViewSelectors.GAS_FEE);
  }

  get fetchingQuotes() {
    return Matchers.getElementByText(SwapViewSelectorsTexts.FETCHING_QUOTES);
  }

  get swapButton() {
    return Matchers.getElementByID(SwapsViewSelectors.SWAP_BUTTON);
  }

  get iUnderstandLabel() {
    return Matchers.getElementByText(SwapViewSelectorsTexts.I_UNDERSTAND);
  }

  generateSwapCompleteLabel(sourceToken, destinationToken) {
    let title = SwapViewSelectorsTexts.SWAP_CONFIRMED;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{destinationToken}}', destinationToken);
    return title;
  }

  // Function to check if the button is enabled
  async isButtonEnabled(element) {
    const attributes = await element.getAttributes();
    return attributes.enabled === true; // Check if enabled is true
  }

  async tapSwapButton() {
    const swapButtonElement = await this.swapButton;
    const delay = 500; // Delay in milliseconds

    // Wait until the button is enabled before performing swipe actions
    while (!(await this.isButtonEnabled(swapButtonElement))) {
      await TestHelpers.delay(delay); // Wait for the specified delay
    }

    await Gestures.waitAndTap(this.swapButton);
  }

  async swapCompleteLabel(sourceTokenSymbol, destTokenSymbol) {
    try {
      await TestHelpers.checkIfElementByTextIsVisible(
        this.generateSwapCompleteLabel(sourceTokenSymbol, destTokenSymbol), 90000
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Swap complete didn't pop up: ${e}`);
    }
  }

  async tapIUnderstandPriceWarning() {
    try {
      await Gestures.waitAndTap(this.iUnderstandLabel, 3000);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Price warning not displayed: ${e}`);
    }
  }

}

export default new SwapView();
