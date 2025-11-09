export type GetResponseData<DocumentNode> = DocumentNode extends {
  __ensureTypesOfVariablesAndResultMatching?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => infer Result;
}
  ? Result
  : DocumentNode extends {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        __apiType?: (...args: any[]) => infer Result;
      }
    ? Result
    : never;
