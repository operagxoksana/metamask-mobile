import { renderHook, act } from '@testing-library/react-hooks';
import {
  DataDeleteResponseStatus,
  DataDeleteStatus,
  IMetaMetricsEvent,
} from '../../../core/Analytics';
import MetaMetrics from '../../../core/Analytics/MetaMetrics';
import useMetrics from './useMetrics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import {
  CombinedProperties,
  IDeleteRegulationResponse,
  ISegmentClient,
  ITrackingEvent,
} from '../../../core/Analytics/MetaMetrics.types';

jest.mock('../../../core/Analytics/MetaMetrics');

// allows runAfterInteractions to return immediately
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: (callback: () => Promise<void>) => callback(),
}));

const expectedDataDeletionTaskResponse: IDeleteRegulationResponse = {
  status: DataDeleteResponseStatus.ok,
};

const expectedDataDeleteStatus = {
  deletionRequestDate: undefined,
  dataDeletionRequestStatus: DataDeleteStatus.unknown,
  hasCollectedDataSinceDeletionRequest: false,
};

const expectedDate = '20/04/2024';

const expectedDataDeleteRegulationId = 'TWV0YU1hc2t1c2Vzbm9wb2ludCE';

interface GlobalWithSegmentClient {
  segmentMockClient: ISegmentClient;
}

const { segmentMockClient } = global as unknown as GlobalWithSegmentClient;

// Mock class that extends MetaMetrics to simulate trackEvent with overloads
class MockMetaMetrics extends MetaMetrics {
  mockEnabled = true;

  static getInstance = jest.fn(() => new MockMetaMetrics(segmentMockClient));

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
    if (this && this.mockEnabled === undefined) {
      throw new Error("'enabled' is undefined");
    }
  }

  // Mock other methods as needed
  enable = jest.fn((enabled) => Promise.resolve((this.mockEnabled = enabled)));
  addTraitsToUser = jest.fn(() => Promise.resolve());
  createDataDeletionTask = jest.fn(() =>
    Promise.resolve(expectedDataDeletionTaskResponse),
  );
  checkDataDeleteStatus = jest.fn(() =>
    Promise.resolve(expectedDataDeleteStatus),
  );
  getDeleteRegulationCreationDate = jest.fn(() => expectedDate);
  getDeleteRegulationId = jest.fn(() => expectedDataDeleteRegulationId);
  getMetaMetricsId = jest.fn(() =>
    Promise.resolve('4d657461-4d61-436b-8e73-46756e212121'),
  );
  isDataRecorded = jest.fn(() => true);
  isEnabled = jest.fn(() => this.mockEnabled);
}

(MetaMetrics.getInstance as jest.Mock).mockReturnValue(
  MockMetaMetrics.getInstance(),
);

const mockMetrics = MetaMetrics.getInstance() as MockMetaMetrics;

class MockEventDataBuilder extends MetricsEventBuilder {
  addProperties = jest.fn().mockReturnThis();
  addSensitiveProperties = jest.fn().mockReturnThis();
  setSaveDataRecording = jest.fn().mockReturnThis();
  build = jest.fn().mockReturnThis();
}

describe('useMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(MetricsEventBuilder, 'createEventBuilder')
      .mockImplementation((event) => new MockEventDataBuilder(event));
  });

  it('uses MetaMetrics instance', async () => {
    const { result } = renderHook(() => useMetrics());
    expect(result.current).toMatchInlineSnapshot(`
      {
        "addTraitsToUser": [Function],
        "checkDataDeleteStatus": [Function],
        "createDataDeletionTask": [Function],
        "createEventBuilder": [MockFunction],
        "enable": [Function],
        "getDeleteRegulationCreationDate": [Function],
        "getDeleteRegulationId": [Function],
        "getMetaMetricsId": [Function],
        "isDataRecorded": [Function],
        "isEnabled": [Function],
        "trackEvent": [Function],
      }
    `);
  });

  it('calls MetaMetrics functions', async () => {
    const { result } = renderHook(() => useMetrics());

    const event: IMetaMetricsEvent = {
      category: 'test',
    };

    const {
      trackEvent,
      enable,
      addTraitsToUser,
      createDataDeletionTask,
      checkDataDeleteStatus,
      getDeleteRegulationCreationDate,
      getDeleteRegulationId,
      isDataRecorded,
      isEnabled,
    } = result.current;

    let deletionTaskIdValue,
      dataDeleteStatusValue,
      deletionDateValue,
      regulationIdValue,
      isDataRecordedValue,
      isEnabledValue;

    await act(async () => {
      trackEvent(event);
      await enable(true);
      await addTraitsToUser({});
      deletionTaskIdValue = await createDataDeletionTask();
      dataDeleteStatusValue = await checkDataDeleteStatus();
      deletionDateValue = getDeleteRegulationCreationDate();
      regulationIdValue = getDeleteRegulationId();
      isDataRecordedValue = isDataRecorded();
      isEnabledValue = isEnabled();
    });

    expect(mockMetrics.trackEvent).toHaveBeenCalledWith(event);
    expect(mockMetrics.enable).toHaveBeenCalledWith(true);
    expect(mockMetrics.addTraitsToUser).toHaveBeenCalledWith({});

    expect(mockMetrics.createDataDeletionTask).toHaveBeenCalled();
    expect(deletionTaskIdValue).toEqual(expectedDataDeletionTaskResponse);

    expect(mockMetrics.checkDataDeleteStatus).toHaveBeenCalled();
    expect(dataDeleteStatusValue).toEqual(expectedDataDeleteStatus);

    expect(mockMetrics.getDeleteRegulationCreationDate).toHaveBeenCalled();
    expect(deletionDateValue).toEqual(expectedDate);

    expect(mockMetrics.getDeleteRegulationId).toHaveBeenCalled();
    expect(regulationIdValue).toEqual(expectedDataDeleteRegulationId);

    expect(mockMetrics.isDataRecorded).toHaveBeenCalled();
    expect(isDataRecordedValue).toEqual(true);

    expect(mockMetrics.isEnabled).toHaveBeenCalled();
    expect(isEnabledValue).toBeTruthy();
  });

  it('uses the correct instance context', () => {
    const { result } = renderHook(() => useMetrics());

    const legacyEvent: IMetaMetricsEvent = {
      category: 'test',
    };
    const event: ITrackingEvent = {
      name: 'test',
      properties: {},
      sensitiveProperties: {},
      saveDataRecording: false,
      get hasProperties(): boolean {
        return false;
      },
      get isAnonymous(): boolean {
        return false;
      },
    };
    const newEvent = MetricsEventBuilder.createEventBuilder({
      category: 'test',
    }).build();

    act(() => {
      result.current.trackEvent(legacyEvent);
      result.current.trackEvent(event);
      result.current.trackEvent(newEvent);
    });

    expect(mockMetrics.trackEvent).toHaveBeenCalledWith(legacyEvent);
    expect(mockMetrics.trackEvent).toHaveBeenCalledWith(event);
    expect(mockMetrics.trackEvent).toHaveBeenCalledWith(newEvent);
    expect(mockMetrics.enable).toBeTruthy();
  });
});
