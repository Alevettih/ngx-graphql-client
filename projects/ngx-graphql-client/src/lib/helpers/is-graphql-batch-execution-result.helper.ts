import { type ExecutionResult } from 'graphql';

import { isGraphQLExecutionResult } from './is-graphql-execution-result.helper';

export function isGraphQLBatchExecutionResult(
  bodies: unknown,
): bodies is ExecutionResult[] {
  return (
    Array.isArray(bodies) &&
    bodies.every((body: ExecutionResult): boolean =>
      isGraphQLExecutionResult(body),
    )
  );
}
