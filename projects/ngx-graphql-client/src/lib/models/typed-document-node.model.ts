import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { TypedQueryDocumentNode } from 'graphql';

export type TypedGraphQLDocumentNode<Data, Variables> =
  | TypedQueryDocumentNode<Data, Variables>
  | TypedDocumentNode<Data, Variables>;
