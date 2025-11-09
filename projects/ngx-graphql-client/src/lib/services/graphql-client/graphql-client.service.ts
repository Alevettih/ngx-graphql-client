import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { mergeWith, omit } from 'es-toolkit';
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
  type RequestContext,
  type RequestData,
  type TypedGraphQLDocumentNode,
} from '../../models';
import { type GetResponseData, type UnionToIntersection } from '../../types';

import {
  NGX_GRAPHQL_CLIENT_CUSTOM_REQUEST_CONTEXT,
  NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER,
  NGX_GRAPHQL_CLIENT_CONFIG,
} from './graphql-client.tokens';

@Injectable()
export class GraphQLClient {
  public readonly url: string =
    inject(NGX_GRAPHQL_CLIENT_CONFIG, { optional: true })?.url ??
    '/api/graphql';

  private readonly http: HttpClient = inject(HttpClient);

  public query<Operation, Variables>(
    document: TypedGraphQLDocumentNode<Operation, Variables>,
    variables: Variables,
    context: RequestContext = {},
  ): Observable<Operation> {
    return this.send(
      {
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables,
      },
      context,
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
    context: RequestContext = {},
  ): Observable<Operation> {
    return this.send(
      {
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables,
      },
      context,
    ).pipe(
      map(
        (response) =>
          (response as ExecutionResult | undefined)?.data as Operation,
      ),
    );
  }

  public batch<
    Data extends BatchData[],
    ResponseData extends object = Extract<
      GetResponseData<Data[number]['document']>,
      object
    >,
  >(
    requests: Data,
    context: RequestContext = {},
  ): Observable<UnionToIntersection<ResponseData>> {
    return this.send(
      requests.map(({ document, variables }) => ({
        operationName: this.getOperationName(document.definitions),
        query: print(document),
        variables: variables as unknown,
      })),
      context,
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
    ctx?: RequestContext,
  ): Observable<Response> {
    const contextInst: HttpContext = new HttpContext();
    contextInst.set(
      NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER,
      ctx?.errorHandlerFn,
    );
    contextInst.set(
      NGX_GRAPHQL_CLIENT_CUSTOM_REQUEST_CONTEXT,
      omit(ctx ?? {}, ['errorHandlerFn']),
    );

    return this.http
      .post(this.url, body, {
        context: contextInst,
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(first()) as Observable<Response>;
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
