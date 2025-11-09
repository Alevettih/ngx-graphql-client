import { capitalize } from 'es-toolkit';
import { parse } from 'graphql';

import { type TypedGraphQLDocumentNode } from '../../../models';

import { type MockGenerationResult } from './mock-generation-result.model';

export function generateMock<
  EntityName extends string,
  OperationName extends string = `${Capitalize<EntityName>}Query`,
  ResponseData = Record<EntityName, Record<'id' | 'name', string>>,
  RequestVariables = Record<'id', string>,
>(
  entityName: EntityName,
  operationName: OperationName = `${capitalize(entityName)}Query` as OperationName,
): (id?: string) => MockGenerationResult<ResponseData, RequestVariables> {
  return (
    id: string = '1',
  ): MockGenerationResult<ResponseData, RequestVariables> => {
    return {
      data: {
        [entityName]: {
          id,
          name: `Test ${id}`,
        },
      } as ResponseData,
      variables: {
        id,
      } as RequestVariables,
      document: parse(`
        query ${operationName}($id: ID!) {
          ${entityName}(id: $id) {
            id
            name
          }
        }
      `) as TypedGraphQLDocumentNode<ResponseData, RequestVariables>,
    };
  };
}
