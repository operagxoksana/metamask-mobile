// Third party dependencies.
import React from 'react';
import { shallow } from 'enzyme';

// Internal dependencies.
import BadgeStatus from './BadgeStatus';
import {
  BADGE_STATUS_TEST_ID,
  SAMPLE_BADGESTATUS_PROPS,
} from './BadgeStatus.constants';

describe('BadgeStatus', () => {
  it('should render badge status correctly', () => {
    const { toJSON } = render(<BadgeStatus {...SAMPLE_BADGESTATUS_PROPS} />);
    expect(toJSON()).toMatchSnapshot();
  });
  it('should render badge status', () => {
    const { toJSON } = render(<BadgeStatus {...SAMPLE_BADGESTATUS_PROPS} />);

    const contentElement = wrapper.findWhere(
      (node) => node.prop('testID') === BADGE_STATUS_TEST_ID,
    );
    expect(contentElement.exists()).toBe(true);
  });
});
