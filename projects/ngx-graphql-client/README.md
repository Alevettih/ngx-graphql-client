# @alevettih/ngx-graphql-client

A typed GraphQL client for Angular applications with full TypeScript support.

## Installation

```bash
npm install ngx-graphql-client
```

### Requirements

- Angular 18.0.0 or later
- GraphQL 16.0.0 or later
- es-toolkit 1.41.0 or later

## Quick Start

### 1. Provide the Client

Import `provideGraphQLClient` in your `app.config.ts` or `main.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideGraphQLClient } from 'ngx-graphql-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGraphQLClient({
      url: 'https://api.example.com/graphql', // URL of your GraphQL API
    }),
    // ... other providers
  ],
};
```

### 2. Use in Components and Services

```typescript
import { Component, inject, signal } from '@angular/core';
import { GraphQLClient } from 'ngx-graphql-client';
import { gql } from 'graphql-tag';
import { TypedQueryDocumentNode } from 'graphql';

// Define a typed GraphQL operation
const GET_USERS = gql`
  query GetUsers($limit: Int!) {
    users(limit: $limit) {
      id
      name
      email
    }
  }
` as TypedQueryDocumentNode<
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
export class UsersComponent {
  private graphql = inject(GraphQLClient);
  users = signal<Array<{ id: string; name: string; email: string }>>([]);

  ngOnInit() {
    this.graphql.query(GET_USERS, { limit: 10 }).subscribe((data) => {
      this.users.set(data.users);
    });
  }
}
```

## API

### GraphQLClient

Primary service for executing GraphQL operations.

#### Methods

##### `query<Operation, Variables>(operation, variables, context?)`

Executes a GraphQL query operation.

**Parameters:**

- `operation: TypedQueryDocumentNode<Operation, Variables>` – typed GraphQL operation
- `variables: Variables` – operation variables
- `context?: RequestContext` – optional request context

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
` as TypedQueryDocumentNode<
  { user: { id: string; name: string } },
  { id: string }
>;

this.graphql.query(GET_USER, { id: '123' }).subscribe((data) => {
  console.log(data.user);
});
```

##### `mutate<Operation, Variables>(operation, variables, context?)`

Executes a GraphQL mutation.

**Parameters:**

- `operation: TypedQueryDocumentNode<Operation, Variables>` – typed GraphQL operation
- `variables: Variables` – operation variables
- `context?: RequestContext` – optional request context

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
` as TypedQueryDocumentNode<
  { createUser: { id: string; name: string } },
  { input: { name: string; email: string } }
>;

this.graphql
  .mutate(CREATE_USER, { input: { name: 'John', email: 'john@example.com' } })
  .subscribe((data) => {
    console.log(data.createUser);
  });
```

##### `batch<Data, ResponseData>(requests, context?)`

Executes multiple GraphQL operations in a single HTTP request (batch request).

**Parameters:**

- `requests: BatchData[]` – list of operations to execute
- `context?: RequestContext` – optional request context

**Returns:** `Observable<UnionToIntersection<ResponseData>>`

**Example:**

```typescript
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
  document: TypedQueryDocumentNode<Operation, Variables>;
  variables: Variables;
}
```

#### GraphQLErrorResponse

Extended `HttpErrorResponse` with additional GraphQL error details:

```typescript
interface GraphQLErrorResponse<Data = unknown, Error = unknown>
  extends HttpErrorResponse {
  error: {
    errors: Error[];
    data: Data;
    response: HttpResponse<unknown>;
    request: HttpRequest<unknown>;
  };
}
```

#### RequestContext

```typescript
interface RequestContext {
  [key: string]: unknown;
  errorHandlerFn?: ErrorHandlerFn; // Custom error handler for the request
}
```

## Error Handling

The library automatically processes GraphQL errors via an HTTP interceptor. If a GraphQL response contains errors, they are converted into a `GraphQLErrorResponse` and thrown.

### Global Error Handling

By default, errors are logged to the console. You can also handle them in a component:

```typescript
this.graphql.query(GET_USER, { id: '123' }).subscribe({
  next: (data) => {
    // Handle successful response
  },
  error: (error: GraphQLErrorResponse) => {
    // Handle the error
    console.error('GraphQL error:', error.error.errors);
  },
});
```

### Per-request Error Handling

Use `errorHandlerFn` in the request context for custom handling:

```typescript
this.graphql
  .query(
    GET_USER,
    { id: '123' },
    {
      errorHandlerFn: (error) => {
        // Your handling logic
        if (
          error.error.errors.some(
            (e) => e.extensions?.code === 'UNAUTHENTICATED',
          )
        ) {
          // Redirect to the login page
          this.router.navigate(['/login']);
          return EMPTY;
        }
        throw error;
      },
    },
  )
  .subscribe();
```

**ErrorHandlerFn type:**

```typescript
type ErrorHandlerFn<R = unknown> = (error: HttpErrorResponse) => R;
```

## Type Safety

The library fully supports typed GraphQL operations via `TypedQueryDocumentNode` from the `graphql` package. This gives you:

- Autocomplete for operation variables
- Type safety for operation results
- Compile-time type checks

We recommend using schema-based type generation tools such as:

- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Apollo Codegen](https://www.apollographql.com/docs/devtools/cli/)

## Compatibility

- **Angular:** 18.0.0, 19.0.0, 20.0.0
- **GraphQL:** 16.0.0+
- **TypeScript:** 5.0+

## License

This library is distributed under the [MIT](../../LICENSE) license.

## Support

If you have questions or run into issues, please open an issue in the project repository.
