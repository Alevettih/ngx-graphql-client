import { capitalize } from 'es-toolkit';
import { parse, type TypedQueryDocumentNode } from 'graphql';

import { type MockGenerationResult } from './mock-generation-result.model';

export function generateMock<
  EntityName extends string,
  OperationName extends string = `${Capitalize<EntityName>}Mutation`,
  ResponseData = Record<EntityName, Record<'id' | 'name', string>>,
  RequestVariables = Record<'input', Record<'name', string>>,
>(
  entityName: EntityName,
  operationName: OperationName = `${capitalize(entityName)}Mutation` as OperationName,
): (name?: string) => MockGenerationResult<ResponseData, RequestVariables> {
  return (
    name: string = 'New Item',
  ): MockGenerationResult<ResponseData, RequestVariables> => {
    return {
      data: {
        [entityName]: {
          id: '456',
          name,
        },
      } as ResponseData,
      variables: {
        input: {
          name,
        },
      } as RequestVariables,
      document: parse(`
        mutation ${operationName}($input: UserInput!) {
          ${entityName}(input: $input) {
            id
            name
          }
        }
      `) as TypedQueryDocumentNode<ResponseData, RequestVariables>,
    };
  };
}
