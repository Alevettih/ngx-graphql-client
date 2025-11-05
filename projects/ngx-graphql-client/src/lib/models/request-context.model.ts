import { type ErrorHandlerFn } from '../types';

export interface RequestContext {
  [key: string]: unknown;
  errorHandlerFn?: ErrorHandlerFn;
}
