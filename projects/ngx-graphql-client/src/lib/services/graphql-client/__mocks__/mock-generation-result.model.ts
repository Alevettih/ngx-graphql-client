import { type TypedGraphQLDocumentNode } from '../../../models';

export interface MockGenerationResult<ResponseData, RequestVariables> {
  data: ResponseData;
  variables: RequestVariables;
  document: TypedGraphQLDocumentNode<ResponseData, RequestVariables>;
}
