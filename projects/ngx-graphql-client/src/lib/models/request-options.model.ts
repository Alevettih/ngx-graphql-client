import { HttpClient } from '@angular/common/http';

export type RequestOptions = Parameters<HttpClient['post']>[2];
