import { type HttpErrorResponse, type HttpRequest, type HttpResponse } from '@angular/common/http';

export interface GraphQLErrorResponse<Data = unknown, Error = unknown> extends HttpErrorResponse {
  error: {
    errors: Error[];
    data: Data;
    response: HttpResponse<unknown>;
    request: HttpRequest<unknown>;
  };
}
