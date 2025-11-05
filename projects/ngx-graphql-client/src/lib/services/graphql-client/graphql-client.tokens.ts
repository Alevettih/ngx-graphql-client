import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

import { type GraphQLErrorResponse } from '../../models';
import { type GraphQLClientConfig } from '../../models/graphql-client-config.model';
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

export const NGX_GRAPHQL_CLIENT_CUSTOM_REQUEST_CONTEXT: HttpContextToken<Record<string, unknown>> =
  new HttpContextToken<Record<string, unknown>>((): Record<string, unknown> => ({}));
