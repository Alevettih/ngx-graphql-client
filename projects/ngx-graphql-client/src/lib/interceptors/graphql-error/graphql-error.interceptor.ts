import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
  type HttpResponse,
} from '@angular/common/http';
import { type GraphQLError } from 'graphql';
import { catchError, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  isHTTPResponse,
  isGraphQLExecutionResult,
  isGraphQLBatchExecutionResult,
} from '../../helpers';
import { type GraphQLErrorResponse } from '../../models';
import { NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER } from '../../services';
import { type ErrorHandlerFn } from '../../types';

export const graphQLErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(request).pipe(
    tap((response: HttpEvent<unknown>) => {
      if (isHTTPResponse(response)) {
        const { body } = response;

        if (isGraphQLBatchExecutionResult(body)) {
          for (const { errors, data } of body) {
            if (errors?.length) {
              throw createError(response, request, errors, data);
            }
          }
        } else if (isGraphQLExecutionResult(body)) {
          const { errors, data } = body;

          if (errors?.length) {
            throw createError(response, request, errors, data);
          }
        }
      }
    }),
    catchError((error: GraphQLErrorResponse): never => {
      const handler: ErrorHandlerFn | null = request.context.get(
        NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER,
      );

      if (handler) {
        return handler(error) as never;
      }

      console.error(error);
      throw error;
    }),
  );
};

function createError<Data = Record<string, unknown>>(
  response: HttpResponse<unknown>,
  request: HttpRequest<unknown>,
  errors?: readonly GraphQLError[],
  data?: Data,
): GraphQLErrorResponse<Data, Error> {
  return new HttpErrorResponse({
    url: response.url as string,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    error: {
      errors: errors ?? [],
      data,
      response,
      request,
    },
  });
}
