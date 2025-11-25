import { HttpHeaders, HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';
import { type MockedFunction } from 'vitest';

import { type GraphQLClientConfig } from '../../models';

import { listQuery, itemQuery, itemMutation } from './__mocks__';
import { GraphQLClient } from './graphql-client.service';
import { NGX_GRAPHQL_CLIENT_CONFIG } from './graphql-client.tokens';

describe('GraphQLClient', () => {
  function setup<D>(
    responseData: D,
    config?: GraphQLClientConfig,
  ): {
    service: GraphQLClient;
    http: { post: MockedFunction<HttpClient['post']> };
    getRequestBody<B>(): B;
    getRequestOptions(): Parameters<HttpClient['patch']>[2];
  } {
    const http = {
      post: vi.fn().mockReturnValue(of(responseData)),
    } as { post: MockedFunction<HttpClient['post']> };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GraphQLClient,
        { provide: HttpClient, useValue: http },
        {
          provide: NGX_GRAPHQL_CLIENT_CONFIG,
          useValue: config,
        },
      ],
    });

    const service = TestBed.inject(GraphQLClient);

    return {
      http,
      service,
      getRequestBody<B>(): B {
        return http.post.mock.calls[0][1] as B;
      },
      getRequestOptions(): Parameters<HttpClient['patch']>[2] {
        return http.post.mock.calls[0][2];
      },
    };
  }

  describe('initialization', () => {
    it('should be created', () => {
      expect(setup({}).service).toBeTruthy();
    });

    it('should use default URL when no config provided', () => {
      expect(setup({}).service.url).toBe('/api/graphql');
    });

    it('should use custom URL from config', () => {
      expect(
        setup({}, { url: 'https://api.example.com/graphql' }).service.url,
      ).toBe('https://api.example.com/graphql');
    });
  });

  describe('query', () => {
    it('should send query request with correct format', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, http } = setup({ data });
      const result = await lastValueFrom(service.query(document, variables));

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(
        '/api/graphql',
        {
          operationName: 'UserQuery',
          query: expect.stringContaining('query UserQuery') as string,
          variables,
        },
        expect.objectContaining({
          headers: expect.any(HttpHeaders) as HttpHeaders,
        }),
      );
      expect(result).toEqual(data);
    });

    it('should extract operation name correctly', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestBody } = setup({ data });

      await lastValueFrom(service.query(document, variables));

      expect(getRequestBody<{ operationName: string }>().operationName).toBe(
        'UserQuery',
      );
    });
  });

  describe('mutate', () => {
    it('should send mutation request with correct format', async (): Promise<void> => {
      const { document, variables, data } = itemMutation.generateMock('user')();
      const { service, http } = setup({
        data,
      });
      const result = await lastValueFrom(service.mutate(document, variables));

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(
        '/api/graphql',
        {
          operationName: 'UserMutation',
          query: expect.stringContaining('mutation UserMutation') as string,
          variables,
        },
        expect.objectContaining({
          headers: expect.any(HttpHeaders) as HttpHeaders,
        }),
      );
      expect(result).toEqual(data);
    });

    it('should extract operation name correctly for mutation', async (): Promise<void> => {
      const { document, variables, data } = itemMutation.generateMock('user')();
      const { service, getRequestBody } = setup({ data });

      await lastValueFrom(service.mutate(document, variables));

      expect(getRequestBody<{ operationName: string }>().operationName).toBe(
        'UserMutation',
      );
    });
  });

  describe('batch', () => {
    it('should send batch request with multiple operations and merge responses correctly', async (): Promise<void> => {
      const [userQuery, postsListQuery] = [
        itemQuery.generateMock('user')('1'),
        listQuery.generateMock('posts')(10),
      ];
      const { service, http } = setup([
        { data: userQuery.data },
        { data: postsListQuery.data },
      ]);
      const result = await lastValueFrom(
        service.batch([
          { document: userQuery.document, variables: userQuery.variables },
          {
            document: postsListQuery.document,
            variables: postsListQuery.variables,
          },
        ]),
      );

      expect(http.post).toHaveBeenCalledWith(
        '/api/graphql',
        [
          {
            operationName: 'UserQuery',
            query: expect.stringContaining('query UserQuery') as string,
            variables: userQuery.variables,
          },
          {
            operationName: 'PostsListQuery',
            query: expect.stringContaining('query PostsListQuery') as string,
            variables: postsListQuery.variables,
          },
        ],
        expect.objectContaining({
          headers: expect.any(HttpHeaders) as HttpHeaders,
        }),
      );
      expect(result).toEqual({
        ...userQuery.data,
        ...postsListQuery.data,
      });
    });

    it('should handle single response correctly in batch', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service } = setup({ data });
      const result = await lastValueFrom(
        service.batch([{ document, variables }]),
      );

      expect(result).toEqual(data);
    });

    it('should concatenate arrays when merging batch responses', async (): Promise<void> => {
      const [firstList, secondList] = [
        listQuery.generateMock('items')(2),
        listQuery.generateMock('items')(1, 3),
      ];
      const { service } = setup([
        { data: firstList.data },
        { data: secondList.data },
      ]);
      const result = await lastValueFrom(
        service.batch([
          { document: firstList.document, variables: firstList.variables },
          { document: secondList.document, variables: secondList.variables },
        ]),
      );

      expect(result).toEqual({
        items: [...firstList.data['items'], ...secondList.data['items']],
      });
    });
  });

  describe('request formatting', () => {
    it('should set Content-Type header to application/json', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });

      await lastValueFrom(service.query(document, variables));

      const headers = getRequestOptions()?.headers as HttpHeaders;
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should merge HttpHeaders with default Content-Type header', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });
      const authorizationToken = 'Bearer test-token';

      await lastValueFrom(
        service.query(document, variables, {
          headers: new HttpHeaders({
            Authorization: authorizationToken,
          }),
        }),
      );

      const headers = getRequestOptions()?.headers as HttpHeaders;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe(authorizationToken);
    });

    it('should merge literal headers with default Content-Type header', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });

      await lastValueFrom(
        service.query(document, variables, {
          headers: {
            Authorization: 'Bearer literal-token',
          },
        }),
      );

      const headers = getRequestOptions()?.headers as HttpHeaders;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer literal-token');
    });

    it('should handle query without operation name', async (): Promise<void> => {
      const { document, variables, data } = itemQuery.generateMock(
        'test',
        '',
      )();
      const { service, getRequestBody } = setup({
        data,
      });
      await lastValueFrom(service.query(document, variables));

      expect(
        getRequestBody<{
          operationName: string | undefined;
        }>().operationName,
      ).toBeUndefined();
    });
  });
});
