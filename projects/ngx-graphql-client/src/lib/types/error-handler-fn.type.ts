import { type HttpErrorResponse } from '@angular/common/http';

export type ErrorHandlerFn<R = unknown> = (error: HttpErrorResponse) => R;
