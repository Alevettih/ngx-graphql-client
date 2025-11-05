import { TypedQueryDocumentNode } from 'graphql';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BatchData<Operation = any, Variables = any> {
  document: TypedQueryDocumentNode<Operation, Variables>;
  variables: Variables;
}
