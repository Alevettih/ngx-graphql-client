import {
  HttpEventType,
  type HttpEvent,
  type HttpResponse,
} from '@angular/common/http';

export function isHTTPResponse<T>(
  response: HttpEvent<T>,
): response is HttpResponse<T> {
  return response.type === HttpEventType.Response;
}
