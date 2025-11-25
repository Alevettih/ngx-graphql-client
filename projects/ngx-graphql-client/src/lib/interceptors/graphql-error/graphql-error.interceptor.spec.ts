import {
  HttpContext,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { lastValueFrom, of, throwError } from 'rxjs';

import { type GraphQLErrorResponse } from '../../models';
import { NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER } from '../../services';

import { graphQLErrorInterceptor } from './graphql-error.interceptor';

describe('graphQLErrorInterceptor', (): void => {
  function generateResponse(body: unknown): HttpResponse<unknown> {
    return new HttpResponse({
      body,
      status: 200,
      statusText: 'OK',
      url: '/api/graphql',
    });
  }

  function setup(
    response: HttpResponse<unknown> | HttpErrorResponse,
    context?: HttpContext,
  ): {
    testNext: (next: (data: unknown) => void) => Promise<void>;
    testError: (error: (error: GraphQLErrorResponse) => void) => Promise<void>;
    response: HttpResponse<unknown> | HttpErrorResponse;
  } {
    const mockNext = vi.fn();
    const request: HttpRequest<unknown> = new HttpRequest(
      'POST',
      '/api/graphql',
      { query: 'query { test }' },
      { context },
    );

    if (response instanceof HttpErrorResponse) {
      mockNext.mockReturnValue(throwError((): HttpErrorResponse => response));
    } else {
      mockNext.mockReturnValue(of(response));
    }

    return {
      testNext: (next: (data: unknown) => void): Promise<void> =>
        lastValueFrom(graphQLErrorInterceptor(request, mockNext)).then(
          next,
          (): never => {
            throw new Error('Should not throw error');
          },
        ),
      testError: (
        error: (error: GraphQLErrorResponse) => void,
      ): Promise<void> =>
        lastValueFrom(graphQLErrorInterceptor(request, mockNext)).then(
          (): never => {
            throw new Error('Should throw error');
          },
          error,
        ),
      response,
    };
  }

  describe('when response is successful without errors', (): void => {
    it('should pass through successful responses', async (): Promise<void> => {
      const { response, testNext } = setup(
        generateResponse({ data: { test: 'value' } }),
      );

      await testNext((result: unknown): void => {
        expect(result).toBe(response);
      });
    });
  });

  describe('when response contains GraphQL errors', (): void => {
    describe('(single)', (): void => {
      it('should throw GraphQLErrorResponse when errors are present', async (): Promise<void> => {
        const { testError } = setup(
          generateResponse({
            data: { test: 'value' },
            errors: [{ message: 'Test error' }],
          }),
        );

        await testError((error: GraphQLErrorResponse): void => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.error.errors).toEqual([{ message: 'Test error' }]);
          expect(error.error.data).toEqual({ test: 'value' });
        });
      });
    });

    describe('(batch)', (): void => {
      it('should throw GraphQLErrorResponse for error in any batch item', async (): Promise<void> => {
        const { testError } = setup(
          generateResponse([
            {
              data: { test1: 'value1' },
            },
            {
              data: { test2: 'value2' },
              errors: [{ message: 'Second error' }],
            },
          ]),
        );

        await testError((error: GraphQLErrorResponse): void => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.error.errors).toEqual([{ message: 'Second error' }]);
          expect(error.error.data).toEqual({ test2: 'value2' });
        });
      });
    });
  });

  describe('when response is not a GraphQL execution result', (): void => {
    it('should pass through non-GraphQL responses', async (): Promise<void> => {
      const { response, testNext } = setup(
        generateResponse({ message: 'Not GraphQL' }),
      );

      await testNext((result: unknown): void => {
        expect(result).toBe(response);
      });
    });
  });

  describe('when HTTP error occurs', (): void => {
    it('should handle HTTP errors with custom handler', async (): Promise<void> => {
      const customHandler = vi
        .fn()
        .mockReturnValue(
          throwError((): HttpResponse<unknown> | HttpErrorResponse => response),
        );
      const context = new HttpContext();

      context.set(NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER, customHandler);

      const { response, testError } = setup(
        new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          url: '/api/graphql',
        }),
        context,
      );

      await testError((error: GraphQLErrorResponse): void => {
        expect(customHandler).toHaveBeenCalledTimes(1);
        expect(customHandler).toHaveBeenCalledWith(response);
        expect(error).toBe(response);
      });
    });

    it('should log and rethrow HTTP errors without custom handler', async (): Promise<void> => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { response, testError } = setup(
        new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          url: '/api/graphql',
        }),
      );

      await testError((error: GraphQLErrorResponse): void => {
        expect(consoleSpy).toHaveBeenCalledWith(response);
        expect(error).toBe(response);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle response with errors but no data', async (): Promise<void> => {
      const { testError } = setup(
        generateResponse({
          errors: [{ message: 'Error without data' }],
        }),
      );

      await testError((error: GraphQLErrorResponse): void => {
        expect(error.error.errors).toEqual([{ message: 'Error without data' }]);
        expect(error.error.data).toBeUndefined();
      });
    });

    it('should handle empty errors array', async (): Promise<void> => {
      const { response, testNext } = setup(
        generateResponse({
          data: { test: 'value' },
          errors: [],
        }),
      );

      await testNext((result: unknown): void => {
        expect(result).toBe(response);
      });
    });
  });
});
