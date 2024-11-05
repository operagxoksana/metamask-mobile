import {
  determineIfFeatureEntryFromURL,
  getDecodedProxiedURL,
} from '../helpers';

// TODO: Export user storage schema from @metamask/profile-sync-controller
export const pathRegexps = {
  accounts:
    /https:\/\/user-storage\.api\.cx\.metamask\.io\/api\/v1\/userstorage\/accounts/u,
  networks:
    /https:\/\/user-storage\.api\.cx\.metamask\.io\/api\/v1\/userstorage\/networks/u,
  notifications:
    /https:\/\/user-storage\.api\.cx\.metamask\.io\/api\/v1\/userstorage\/notifications/u,
};

export class UserStorageMockttpController {
  paths = new Map();

  async onGet(path, request, statusCode = 200) {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      return {
        statusCode,
        json: null,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    if (isFeatureEntry) {
      const json =
        internalPathData.response?.find(
          (entry) =>
            entry.HashedKey ===
            getDecodedProxiedURL(request.url).split('/').pop(),
        ) || null;

      return {
        statusCode,
        json,
      };
    }

    const json = internalPathData?.response.length
      ? internalPathData.response
      : null;

    return {
      statusCode,
      json,
    };
  }

  async onPut(path, request, statusCode = 204) {
    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    const data = await request.body.getJson();

    const newOrUpdatedSingleOrBatchEntries =
      isFeatureEntry && typeof data?.data === 'string'
        ? [
            {
              HashedKey: getDecodedProxiedURL(request.url).split('/').pop(),
              Data: data?.data,
            },
          ]
        : Object.entries(data?.data).map(([key, value]) => ({
            HashedKey: key,
            Data: value,
          }));

    newOrUpdatedSingleOrBatchEntries.forEach((entry) => {
      const internalPathData = this.paths.get(path);

      if (!internalPathData) {
        return;
      }

      const doesThisEntryExist = internalPathData.response?.find(
        (existingEntry) => existingEntry.HashedKey === entry.HashedKey,
      );

      if (doesThisEntryExist) {
        this.paths.set(path, {
          ...internalPathData,
          response: internalPathData.response.map((existingEntry) =>
            existingEntry.HashedKey === entry.HashedKey ? entry : existingEntry,
          ),
        });
      } else {
        this.paths.set(path, {
          ...internalPathData,
          response: [...(internalPathData?.response || []), entry],
        });
      }
    });

    return {
      statusCode,
    };
  }

  async onDelete(path, request, statusCode = 204) {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      return {
        statusCode,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    if (isFeatureEntry) {
      this.paths.set(path, {
        ...internalPathData,
        response: internalPathData?.response.filter(
          (entry) =>
            entry.HashedKey !==
            getDecodedProxiedURL(request.url).split('/').pop(),
        ),
      });
    } else {
      this.paths.set(path, {
        ...internalPathData,
        response: [],
      });
    }

    return {
      statusCode,
    };
  }

  async setupPath(path, server, overrides) {
    const previouslySetupPath = this.paths.get(path);

    this.paths.set(path, {
      response: overrides?.getResponse || previouslySetupPath?.response || [],
    });

    await server
      .forGet('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onGet(path, request, overrides?.getStatusCode),
      );
    await server
      .forPut('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onPut(path, request, overrides?.putStatusCode),
      );
    await server
      .forDelete('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onDelete(path, request, overrides?.deleteStatusCode),
      );
  }
}
