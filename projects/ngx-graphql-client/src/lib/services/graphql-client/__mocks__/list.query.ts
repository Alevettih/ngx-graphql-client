import { capitalize } from 'es-toolkit';
import { parse } from 'graphql';

import { type TypedGraphQLDocumentNode } from '../../../models';

import { type MockGenerationResult } from './mock-generation-result.model';

export function generateMock<
  EntityName extends string,
  OperationName extends string = `${Capitalize<EntityName>}ListQuery`,
  ResponseData = Record<EntityName, Record<'id', string>[]>,
  RequestVariables = Record<string, unknown>,
>(
  entityName: EntityName,
  operationName: OperationName = `${capitalize(entityName)}ListQuery` as OperationName,
): (
  length: number,
  startFrom?: number,
) => MockGenerationResult<ResponseData, RequestVariables> {
  return (
    length: number,
    startFrom: number = 1,
  ): MockGenerationResult<ResponseData, RequestVariables> => {
    return {
      data: {
        [entityName]: [...Array(length).keys()].map(
          (id: number): Record<'id', string> => ({
            id: String(id + startFrom),
          }),
        ),
      } as ResponseData,
      variables: {} as RequestVariables,
      document: parse(`
        query ${operationName} {
          ${entityName} {
            id
          }
        }
      `) as TypedGraphQLDocumentNode<ResponseData, RequestVariables>,
    };
  };
}
