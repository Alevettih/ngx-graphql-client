# @alevettih/ngx-graphql-client

A typed GraphQL client for Angular applications with full TypeScript support.

## Installation

```bash
npm install @alevettih/ngx-graphql-client
```

### Requirements

- Angular 18.0.0 or later
- GraphQL 16.0.0 or later
- RxJS 7.8.0 or later
- es-toolkit 1.41.0 or later

## Features

- ✅ Full TypeScript support for GraphQL operations
- ✅ Support for queries, mutations, and batch operations
- ✅ Custom error handlers per request
- ✅ Automatically throws when a GraphQL response includes errors (via the built-in HTTP interceptor)
- ✅ Seamless integration with Angular HttpClient, including support for all `HttpClient.post` options in every client method

## Quick Start

### 1. Provide the Client

Import `provideGraphQLClient` in your `app.config.ts` or `main.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideGraphQLClient } from '@alevettih/ngx-graphql-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGraphQLClient({
      url: 'https://api.example.com/graphql', // URL of your GraphQL API
    }),
    // ... other providers
  ],
};
```

> **Note:** `provideGraphQLClient` registers Angular HttpClient together with the built-in GraphQL error interceptor. If you already call `provideHttpClient` in your application, place your configuration before `provideGraphQLClient` so the interceptors run in the expected order.

### 2. Use in Components and Services

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  GraphQLClient,
  TypedGraphQLDocumentNode,
} from '@alevettih/ngx-graphql-client';
import { gql } from 'graphql-tag';

// Define a typed GraphQL operation
const GET_USERS = gql`
  query GetUsers($limit: Int!) {
    users(limit: $limit) {
      id
      name
      email
    }
  }
` as TypedGraphQLDocumentNode<
  { users: Array<{ id: string; name: string; email: string }> },
  { limit: number }
>;

@Component({
  selector: 'app-users',
  template: `
    @for (user of users(); track user.id) {
      <div>{{ user.name }} - {{ user.email }}</div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private readonly graphql = inject(GraphQLClient);
  readonly users = signal<Array<{ id: string; name: string; email: string }>>(
    [],
  );

  ngOnInit(): void {
    this.graphql.query(GET_USERS, { limit: 10 }).subscribe((data) => {
      this.users.set(data.users);
    });
  }
}
```

> **Note:** The examples use `graphql-tag` for the `gql` template literal. Install it if needed: `npm install graphql-tag`.

## API

### GraphQLClient

Primary service for executing GraphQL operations.

#### Methods

##### `query<Operation, Variables>(document, variables, options?)`

Executes a GraphQL query operation.

**Parameters:**

- `document: TypedGraphQLDocumentNode<Operation, Variables>` – typed GraphQL operation
- `variables: Variables` – operation variables
- `options?: RequestOptions` – optional HTTP options passed to `HttpClient.post`

**Returns:** `Observable<Operation>`

**Example:**

```typescript
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
` as TypedGraphQLDocumentNode<
  { user: { id: string; name: string } },
  { id: string }
>;

this.graphql.query(GET_USER, { id: '123' }).subscribe((data) => {
  console.log(data.user);
});
```

##### `mutate<Operation, Variables>(document, variables, options?)`

Executes a GraphQL mutation.

**Parameters:**

- `document: TypedGraphQLDocumentNode<Operation, Variables>` – typed GraphQL operation
- `variables: Variables` – operation variables
- `options?: RequestOptions` – optional HTTP options passed to `HttpClient.post`

**Returns:** `Observable<Operation>`

**Example:**

```typescript
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
    }
  }
` as TypedGraphQLDocumentNode<
  { createUser: { id: string; name: string } },
  { input: { name: string; email: string } }
>;

this.graphql
  .mutate(CREATE_USER, { input: { name: 'John', email: 'john@example.com' } })
  .subscribe((data) => {
    console.log(data.createUser);
  });
```

##### `batch<Data, ResponseData>(requests, options?)`

Executes multiple GraphQL operations in a single HTTP request (batch request).

**Parameters:**

- `requests: BatchData[]` – list of operations to execute
- `options?: RequestOptions` – optional HTTP options passed to `HttpClient.post`

**Returns:** `Observable<UnionToIntersection<ResponseData>>`

**Example:**

```typescript
import { type BatchData } from '@alevettih/ngx-graphql-client';

const requests: BatchData[] = [
  { document: GET_USERS, variables: { limit: 10 } },
  // Define GET_POSTS in the same way
  { document: GET_POSTS, variables: { limit: 5 } },
];

this.graphql.batch(requests).subscribe((data) => {
  // data contains the combined results of all operations
  console.log(data.users);
  console.log(data.posts);
});
```

### Configuration

#### GraphQLClientConfig

```typescript
interface GraphQLClientConfig {
  url: string; // GraphQL endpoint URL
}
```

**Default:** `url: '/api/graphql'`

### Data Models

#### BatchData

```typescript
interface BatchData<Operation = any, Variables = any> {
  document: TypedGraphQLDocumentNode<Operation, Variables>;
  variables: Variables;
}
```

#### GraphQLErrorResponse

Extended `HttpErrorResponse` with additional error details:

```typescript
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
```

#### RequestOptions

`RequestOptions` maps directly to the third argument of `HttpClient.post`. Use it to pass headers, context values, withCredentials, and other Angular HTTP options.

```typescript
type RequestOptions = Parameters<HttpClient['post']>[2];
```

## Error Handling

The library automatically processes GraphQL errors via an HTTP interceptor. If a GraphQL response contains errors, they are converted into a `GraphQLErrorResponse` and thrown.

By default, the interceptor logs the error and rethrows it. This default behaviour is implemented through an internal request-level error handler token. You can override the handler for individual requests by supplying your own function via the `NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER` `HttpContext` token:

```typescript
import { HttpContext } from '@angular/common/http';
import {
  GraphQLErrorResponse,
  NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER,
} from '@alevettih/ngx-graphql-client';

const context = new HttpContext().set(
  NGX_GRAPHQL_CLIENT_REQUEST_ERROR_HANDLER,
  (error: GraphQLErrorResponse): never => {
    // Perform custom logging, telemetry, or user notification
    console.warn('Custom GraphQL error handler', error.error.errors);
    throw error; // Decide whether to rethrow or return a fallback value
  },
);

this.graphql.query(GET_USER, { id: '123' }, { context }).subscribe();
```

## Type Safety

The library fully supports typed GraphQL operations via the exported `TypedGraphQLDocumentNode`, which accepts both `TypedDocumentNode` (from `@graphql-typed-document-node/core`) and `TypedQueryDocumentNode` (from `graphql`). This gives you:

- Autocomplete for operation variables
- Type safety for operation results
- Compile-time type checks

We recommend using schema-based type generation tools such as:

- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Apollo Codegen](https://www.apollographql.com/docs/devtools/cli/)

## Compatibility

- **Angular:** 18.0.0+
- **GraphQL:** 16.0.0+
- **TypeScript:** Use the version supported by your Angular release (Angular 18+ currently requires TypeScript 5.4 or newer)
- **RxJS:** 7.8+

## License

This library is distributed under the [MIT](../../LICENSE) license.

## Support

If you have questions or run into issues, please open an issue in the project repository.
