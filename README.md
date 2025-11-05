# ngx-graphql-client

A typed GraphQL client for Angular applications that makes it easy to work with
GraphQL APIs using full TypeScript support.

## Overview

`ngx-graphql-client` is an Angular library that provides a simple, type-safe way
to work with GraphQL APIs. The library relies on typed GraphQL operations and
integrates with Angular HttpClient to execute requests.

## Features

- ✅ Full TypeScript support for GraphQL operations
- ✅ Support for queries, mutations, and batch operations
- ✅ Automatic error handling via an HTTP interceptor
- ✅ Custom error handlers per request
- ✅ Integration with Angular HttpClient

## Project Structure

```
ngx-graphql-client/
├── projects/
│   └── ngx-graphql-client/        # Library source code
│       └── src/
│           └── lib/
│               ├── helpers/       # Helpers and type guards
│               ├── interceptors/  # HTTP interceptors
│               ├── models/        # TypeScript models
│               ├── services/      # GraphQLClient service
│               └── types/         # TypeScript types
├── dist/                          # Build artifacts
└── package.json
```

## Development

### Requirements

- Node.js 24+
- npm 11+
- Angular CLI 20.3+

### Install Dependencies

```bash
npm install
```

### Build the Library

```bash
npm run build
```

Or build in watch mode:

```bash
npm run watch
```

### Testing

```bash
npm run test
```

### Linting

Run lint checks:

```bash
npm run lint
```

Auto-fix issues:

```bash
npm run lint:fix
```

### Formatting

Check formatting:

```bash
npm run format:check
```

Auto-format the code:

```bash
npm run format
```

## Library Usage

For detailed usage guidelines, see the
[library README](projects/ngx-graphql-client/README.md).

## Tech Stack

- **Angular** 20+
- **TypeScript** 5.9+
- **GraphQL** 16+
- **RxJS** 7.8+
- **es-toolkit** 1.41+

## License

This project is distributed under the [MIT](LICENSE) license.

## Authors

[@Alevettih](https://github.com/Alevettih)
