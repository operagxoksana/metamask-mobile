import OptinMetrics from './';
import { renderScreen } from '../../../util/test/renderWithProvider';
import {
  DataDeleteResponseStatus,
  DataDeleteStatus,
  IMetaMetricsEvent,
  MetaMetrics,
  MetaMetricsEvents,
} from '../../../core/Analytics';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { strings } from '../../../../locales/i18n';
import {
  CombinedProperties,
  ISegmentClient,
  ITrackingEvent,
} from '../../../core/Analytics/MetaMetrics.types';

const { InteractionManager } = jest.requireActual('react-native');

InteractionManager.runAfterInteractions = jest.fn(async (callback) =>
  callback(),
);

jest.mock('../../../core/Analytics/MetaMetrics');

interface GlobalWithSegmentClient {
  segmentMockClient: ISegmentClient;
}

// Mock class that extends MetaMetrics to simulate trackEvent with overloads
class MockMetaMetrics extends MetaMetrics {
  static getInstance() {
    const { segmentMockClient } = global as unknown as GlobalWithSegmentClient;
    return new MockMetaMetrics(segmentMockClient);
  }

  // Overloaded signatures
  trackEvent(
    event: IMetaMetricsEvent,
    properties?: CombinedProperties,
    saveDataRecording?: boolean,
  ): void;
  trackEvent(event: ITrackingEvent, saveDataRecording?: boolean): void;

  // Mocked implementation handling both overloads
  trackEvent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: IMetaMetricsEvent | ITrackingEvent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    propertiesOrSaveData?: CombinedProperties | boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveData?: boolean,
  ): void {
    return;
  }

  // Mock other methods as needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enable(enabled: boolean): Promise<void> {
    return Promise.resolve();
  }

  addTraitsToUser() {
    return Promise.resolve();
  }

  createDataDeletionTask() {
    return Promise.resolve({
      status: DataDeleteResponseStatus.ok,
    });
  }

  checkDataDeleteStatus() {
    return Promise.resolve({
      deletionRequestDate: undefined,
      dataDeletionRequestStatus: DataDeleteStatus.unknown,
      hasCollectedDataSinceDeletionRequest: false,
    });
  }

  getDeleteRegulationCreationDate() {
    return '20/04/2024';
  }

  getDeleteRegulationId() {
    return 'TWV0YU1hc2t1c2Vzbm9wb2ludCE';
  }

  getMetaMetricsId() {
    return Promise.resolve('4d657461-4d61-436b-8e73-46756e212121');
  }

  isDataRecorded() {
    return true;
  }

  isEnabled() {
    return true;
  }
}

(MetaMetrics.getInstance as jest.Mock).mockReturnValue(
  MockMetaMetrics.getInstance(),
);

const mockMetrics = MetaMetrics.getInstance() as MockMetaMetrics;

jest.mock(
  '../../../util/metrics/UserSettingsAnalyticsMetaData/generateUserProfileAnalyticsMetaData',
  () => jest.fn().mockReturnValue({ userProp: 'User value' }),
);

jest.mock(
  '../../../util/metrics/DeviceAnalyticsMetaData/generateDeviceAnalyticsMetaData',
  () => jest.fn().mockReturnValue({ deviceProp: 'Device value' }),
);

jest.mock('../../../reducers/legalNotices', () => ({
  isPastPrivacyPolicyDate: jest.fn().mockReturnValue(true),
}));

describe('OptinMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render matches snapshot', () => {
    const { toJSON } = renderScreen(
      OptinMetrics,
      { name: 'OptinMetrics' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  describe('sets traits and sends metric event on confirm', () => {
    it('without marketing consent', async () => {
      renderScreen(OptinMetrics, { name: 'OptinMetrics' }, { state: {} });
      fireEvent.press(
        screen.getByRole('button', {
          name: strings('privacy_policy.cta_i_agree'),
        }),
      );
      await waitFor(() => {
        expect(mockMetrics.trackEvent).toHaveBeenNthCalledWith(
          1,
          MetaMetricsEvents.ANALYTICS_PREFERENCE_SELECTED,
          {
            is_metrics_opted_in: true,
            location: 'onboarding_metametrics',
            updated_after_onboarding: false,
          },
        );
        expect(mockMetrics.addTraitsToUser).toHaveBeenNthCalledWith(1, {
          deviceProp: 'Device value',
          userProp: 'User value',
          is_metrics_opted_in: true,
        });
      });
    });

    it('with marketing consent', async () => {
      renderScreen(OptinMetrics, { name: 'OptinMetrics' }, { state: {} });
      fireEvent.press(screen.getByText(strings('privacy_policy.checkbox')));
      fireEvent.press(
        screen.getByRole('button', {
          name: strings('privacy_policy.cta_i_agree'),
        }),
      );
      await waitFor(() => {
        expect(mockMetrics.trackEvent).toHaveBeenNthCalledWith(
          1,
          MetaMetricsEvents.ANALYTICS_PREFERENCE_SELECTED,
          {
            has_marketing_consent: true,
            is_metrics_opted_in: true,
            location: 'onboarding_metametrics',
            updated_after_onboarding: false,
          },
        );
        expect(mockMetrics.addTraitsToUser).toHaveBeenNthCalledWith(1, {
          deviceProp: 'Device value',
          userProp: 'User value',
          is_metrics_opted_in: true,
          has_marketing_consent: true,
        });
      });
    });
  });

  it('does not call metrics on cancel', async () => {
    renderScreen(OptinMetrics, { name: 'OptinMetrics' }, { state: {} });
    fireEvent.press(
      screen.getByRole('button', {
        name: strings('privacy_policy.cta_no_thanks'),
      }),
    );
    await waitFor(() => {
      expect(mockMetrics.trackEvent).not.toHaveBeenCalled();
      expect(mockMetrics.addTraitsToUser).not.toHaveBeenCalled();
    });
  });
});
