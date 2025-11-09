import {
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';

import {
  isHTTPResponse,
  isGraphQLExecutionResult,
  isGraphQLBatchExecutionResult,
} from '../../helpers';
import { GraphQLErrorResponse } from '../../models';
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
          for (const result of body) {
            if (result.errors?.length) {
              throw new GraphQLErrorResponse(response, request, result);
            }
          }
        } else if (isGraphQLExecutionResult(body)) {
          if (body.errors?.length) {
            throw new GraphQLErrorResponse(response, request, body);
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
