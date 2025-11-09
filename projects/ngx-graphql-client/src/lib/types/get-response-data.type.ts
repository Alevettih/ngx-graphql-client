import { TypedGraphQLDocumentNode } from '../models';

export type GetResponseData<
  DocumentNode extends TypedGraphQLDocumentNode<unknown, unknown>,
> = DocumentNode extends {
  __ensureTypesOfVariablesAndResultMatching?: (
    ...args: unknown[]
  ) => infer Result;
}
  ? Result
  : DocumentNode extends {
        __apiType?: (...args: unknown[]) => infer Result;
      }
    ? Result
    : never;
