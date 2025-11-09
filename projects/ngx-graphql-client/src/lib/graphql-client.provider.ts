import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type EnvironmentProviders,
  type Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { graphQLErrorInterceptor } from './interceptors';
import { type GraphQLClientConfig } from './models/graphql-client-config.model';
import { GraphQLClient, NGX_GRAPHQL_CLIENT_CONFIG } from './services';

export function provideGraphQLClient(
  config?: GraphQLClientConfig,
): EnvironmentProviders {
  const providers: Provider[] = [];

  if (config) {
    providers.push({
      provide: NGX_GRAPHQL_CLIENT_CONFIG,
      useValue: config,
    });
  }

  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([graphQLErrorInterceptor])),
    GraphQLClient,
    ...providers,
  ]);
}
