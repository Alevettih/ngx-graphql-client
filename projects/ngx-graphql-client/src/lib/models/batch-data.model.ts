import { TypedGraphQLDocumentNode } from './typed-document-node.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BatchData<Operation = any, Variables = any> {
  document: TypedGraphQLDocumentNode<Operation, Variables>;
  variables: Variables;
}
