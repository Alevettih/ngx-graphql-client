export interface RequestData<V> {
  operationName: string | undefined;
  query: string;
  variables: V;
}
