import { HttpHeaders, HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GraphQLClientConfig } from '../../models';

import { listQuery, itemQuery, itemMutation } from './__mocks__';
import { GraphQLClient } from './graphql-client.service';
import { NGX_GRAPHQL_CLIENT_CONFIG } from './graphql-client.tokens';

describe('GraphQLClient', () => {
  function setup<D>(
    responseData: D,
    config?: GraphQLClientConfig,
  ): {
    service: GraphQLClient;
    http: jest.Mocked<HttpClient>;
    getRequestBody<B>(): B;
    getRequestOptions(): Parameters<HttpClient['patch']>[2];
  } {
    const http = {
      post: jest.fn().mockReturnValue(of(responseData)),
    } as unknown as jest.Mocked<HttpClient>;

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
    it('should send query request with correct format', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, http } = setup({ data });

      service.query(document, variables).subscribe({
        next: (result) => {
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
          done();
        },
      });
    });

    it('should extract operation name correctly', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestBody } = setup({ data });

      service.query(document, variables).subscribe({
        next: () => {
          expect(
            getRequestBody<{ operationName: string }>().operationName,
          ).toBe('UserQuery');
          done();
        },
      });
    });
  });

  describe('mutate', () => {
    it('should send mutation request with correct format', (done) => {
      const { document, variables, data } = itemMutation.generateMock('user')();
      const { service, http } = setup({
        data,
      });

      service.mutate(document, variables).subscribe({
        next: (result) => {
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
          done();
        },
      });
    });

    it('should extract operation name correctly for mutation', (done) => {
      const { document, variables, data } = itemMutation.generateMock('user')();
      const { service, getRequestBody } = setup({ data });

      service.mutate(document, variables).subscribe({
        next: () => {
          expect(
            getRequestBody<{ operationName: string }>().operationName,
          ).toBe('UserMutation');
          done();
        },
      });
    });
  });

  describe('batch', () => {
    it('should send batch request with multiple operations and merge responses correctly', (done) => {
      const [userQuery, postsListQuery] = [
        itemQuery.generateMock('user')('1'),
        listQuery.generateMock('posts')(10),
      ];
      const { service, http } = setup([
        { data: userQuery.data },
        { data: postsListQuery.data },
      ]);

      service
        .batch([
          { document: userQuery.document, variables: userQuery.variables },
          {
            document: postsListQuery.document,
            variables: postsListQuery.variables,
          },
        ])
        .subscribe({
          next: (result) => {
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
                  query: expect.stringContaining(
                    'query PostsListQuery',
                  ) as string,
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
            done();
          },
        });
    });

    it('should handle single response correctly in batch', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service } = setup({ data });

      service.batch([{ document, variables }]).subscribe({
        next: (result) => {
          expect(result).toEqual(data);
          done();
        },
      });
    });

    it('should concatenate arrays when merging batch responses', (done) => {
      const [firstList, secondList] = [
        listQuery.generateMock('items')(2),
        listQuery.generateMock('items')(1, 3),
      ];
      const { service } = setup([
        { data: firstList.data },
        { data: secondList.data },
      ]);

      service
        .batch([
          { document: firstList.document, variables: firstList.variables },
          { document: secondList.document, variables: secondList.variables },
        ])
        .subscribe({
          next: (result) => {
            expect(result).toEqual({
              items: [...firstList.data['items'], ...secondList.data['items']],
            });
            done();
          },
        });
    });
  });

  describe('request formatting', () => {
    it('should set Content-Type header to application/json', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });

      service.query(document, variables).subscribe({
        next: () => {
          const headers = getRequestOptions()?.headers as HttpHeaders;
          expect(headers.get('Content-Type')).toBe('application/json');
          done();
        },
      });
    });

    it('should merge HttpHeaders with default Content-Type header', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });
      const authorizationToken = 'Bearer test-token';

      service
        .query(document, variables, {
          headers: new HttpHeaders({
            Authorization: authorizationToken,
          }),
        })
        .subscribe({
          next: () => {
            const headers = getRequestOptions()?.headers as HttpHeaders;
            expect(headers.get('Content-Type')).toBe('application/json');
            expect(headers.get('Authorization')).toBe(authorizationToken);
            done();
          },
        });
    });

    it('should merge literal headers with default Content-Type header', (done) => {
      const { document, variables, data } = itemQuery.generateMock('user')();
      const { service, getRequestOptions } = setup({ data });

      service
        .query(document, variables, {
          headers: {
            Authorization: 'Bearer literal-token',
          },
        })
        .subscribe({
          next: () => {
            const headers = getRequestOptions()?.headers as HttpHeaders;
            expect(headers.get('Content-Type')).toBe('application/json');
            expect(headers.get('Authorization')).toBe('Bearer literal-token');
            done();
          },
        });
    });

    it('should handle query without operation name', (done) => {
      const { document, variables, data } = itemQuery.generateMock(
        'test',
        '',
      )();
      const { service, getRequestBody } = setup({
        data,
      });

      service.query(document, variables).subscribe({
        next: () => {
          expect(
            getRequestBody<{
              operationName: string | undefined;
            }>().operationName,
          ).toBeUndefined();
          done();
        },
      });
    });
  });
});
