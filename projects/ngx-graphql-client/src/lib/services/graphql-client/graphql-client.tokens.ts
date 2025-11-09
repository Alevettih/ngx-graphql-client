import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

import { GraphQLErrorResponse, type GraphQLClientConfig } from '../../models';
import { type ErrorHandlerFn } from '../../types';

export const NGX_GRAPHQL_CLIENT_CONFIG: InjectionToken<GraphQLClientConfig> =
  new InjectionToken<GraphQLClientConfig>('NGX_GRAPHQL_CLIENT_CONFIG');

export const NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER: HttpContextToken<ErrorHandlerFn | null> =
  new HttpContextToken<ErrorHandlerFn | null>(
    (): ErrorHandlerFn | null =>
      (error: GraphQLErrorResponse): never => {
        console.error(error);
        throw error;
      },
  );
