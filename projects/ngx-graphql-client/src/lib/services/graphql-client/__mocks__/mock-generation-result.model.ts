import { TypedQueryDocumentNode } from 'graphql';

export interface MockGenerationResult<ResponseData, RequestVariables> {
  data: ResponseData;
  variables: RequestVariables;
  document: TypedQueryDocumentNode<ResponseData, RequestVariables>;
}
