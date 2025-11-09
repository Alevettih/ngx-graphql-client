import {
  HttpErrorResponse,
  type HttpRequest,
  type HttpResponse,
} from '@angular/common/http';
import { ExecutionResult } from 'graphql';

export class GraphQLErrorResponse<Data = unknown> extends HttpErrorResponse {
  constructor(
    public readonly response: HttpResponse<unknown> | HttpErrorResponse,
    public readonly request: HttpRequest<unknown>,
    public override readonly error: ExecutionResult<Data>,
  ) {
    super({
      url: response.url as string,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      error,
    });
  }
}
