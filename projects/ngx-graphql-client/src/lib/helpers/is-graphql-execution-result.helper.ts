import { type ExecutionResult } from 'graphql';

export function isGraphQLExecutionResult(
  body: unknown,
): body is ExecutionResult {
  return Boolean(
    body && typeof body === 'object' && ('errors' in body || 'data' in body),
  );
}
