import { GraphQLErrorResponse } from '../models';

export type ErrorHandlerFn<R = unknown> = (error: GraphQLErrorResponse) => R;
