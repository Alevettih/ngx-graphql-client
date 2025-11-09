import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { mergeWith } from 'es-toolkit';
import {
  type DefinitionNode,
  type ExecutionResult,
  isDefinitionNode,
  print,
} from 'graphql';
import { type OperationDefinitionNode } from 'graphql/language/ast';
import { first, map, Observable } from 'rxjs';

import {
  type BatchData,
  type RequestOptions,
  type RequestData,
  type TypedGraphQLDocumentNode,
} from '../../models';
import { type GetResponseData, type UnionToIntersection } from '../../types';

import { NGX_GRAPHQL_CLIENT_CONFIG } from './graphql-client.tokens';

@Injectable()
export class GraphQLClient {
  public readonly url: string =
    inject(NGX_GRAPHQL_CLIENT_CONFIG, { optional: true })?.url ??
    '/api/graphql';

  private readonly http: HttpClient = inject(HttpClient);

  public query<Operation, Variables>(
    document: TypedGraphQLDocumentNode<Operation, Variables>,
    variables: Variables,
    options?: RequestOptions,
  ): Observable<Operation> {
    return this.send(
      {
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables,
      },
      options,
    ).pipe(
      map(
        (response) =>
          (response as ExecutionResult | undefined)?.data as Operation,
      ),
    );
  }

  public mutate<Operation, Variables>(
    document: TypedGraphQLDocumentNode<Operation, Variables>,
    variables: Variables,
    options?: RequestOptions,
  ): Observable<Operation> {
    return this.send(
      {
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables,
      },
      options,
    ).pipe(
      map(
        (response) =>
          (response as ExecutionResult | undefined)?.data as Operation,
      ),
    );
  }

  public batch<
    Data extends BatchData[],
    ResponseData extends object = GetResponseData<Data[number]['document']>,
  >(
    requests: Data,
    options?: RequestOptions,
  ): Observable<UnionToIntersection<ResponseData>> {
    return this.send(
      requests.map(({ document, variables }) => ({
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables: variables as unknown,
      })),
      options,
    ).pipe(
      map(
        (response) =>
          (Array.isArray(response) ? response : [response]) as {
            data: ResponseData;
          }[],
      ),
      map(
        (
          response: ExecutionResult<ResponseData>[],
        ): UnionToIntersection<ResponseData> =>
          response.reduce(
            (
              obj: UnionToIntersection<ResponseData>,
              current: ExecutionResult<ResponseData>,
            ): UnionToIntersection<ResponseData> =>
              mergeWith(
                obj as ResponseData,
                current.data ?? {},
                (destValue, srcValue) =>
                  Array.isArray(destValue)
                    ? destValue.concat(srcValue)
                    : undefined,
              ) as UnionToIntersection<ResponseData>,
            {} as UnionToIntersection<ResponseData>,
          ),
      ),
    );
  }

  private send<Operation, Variables, Response = Operation>(
    body: RequestData<Variables> | RequestData<Variables>[],
    options?: RequestOptions,
  ): Observable<Response> {
    return this.http
      .post(this.url, body, {
        ...options,
        headers: this.mergeHeaders(options?.headers),
      })
      .pipe(first()) as Observable<Response>;
  }

  private mergeHeaders(
    headers?: HttpHeaders | Record<string, string | string[]>,
  ): HttpHeaders {
    if (!headers) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }

    if (headers instanceof HttpHeaders) {
      return headers.has('Content-Type') || headers.has('content-type')
        ? headers
        : headers.set('Content-Type', 'application/json');
    }

    const normalizedHeaders = { ...headers };
    const hasContentType = Object.keys(normalizedHeaders).some(
      (key) => key.toLowerCase() === 'content-type',
    );

    if (!hasContentType) {
      normalizedHeaders['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(normalizedHeaders);
  }

  private getOperationName(
    definitions: readonly DefinitionNode[],
  ): string | undefined {
    const definition = definitions.find(
      isDefinitionNode,
    ) as OperationDefinitionNode;

    return definition.name?.value;
  }
}
