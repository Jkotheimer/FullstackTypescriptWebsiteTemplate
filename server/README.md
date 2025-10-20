# Typescript Server Starter Kit

This repository hosts a boilerplate typescript project that can be used to start building a web service using [expressjs](https://expressjs.com/en/4x/api.html).

## Getting Started

### Prerequisites

First, install all node dependencies:

```sh
npm install
```

A MySQL server is required for this application to function properly. MariaDB will also work just fine.

### Starting the Server

To build the project:

```sh
npm run build
```

To start the server using built data in the `dist/` folder

```sh
npm run server
```

To build and run the project in one command:

```sh
npm start
```

### Troubleshooting

Here are some workarounds and fixes for common issues:

#### Permission Denied

When trying to run the server for the first time, you may encounter this error: `Error: listen EACCES: permission denied 0.0.0.0:443`.

To resolve this error, run the following command:

```sh
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

## Build Process

This project uses `gulp` to automate the build process. To build this project, run the following command:

```sh
npm run build
```

### Compile

The compile task simply transpiles all typescript files into javascript and outputs to the `dist/` folder. All typescript configuration and compiler options are found in the [tsconfig.json](./tsconfig.json) file.

### Fix Imports

This project uses import aliases (e.g. `import '@database/user-repository'`). These aliases make it easy to import local modules without needing to fully type out the relative path using path traversal (e.g. `import '../../database/user-repository.js'`). The `fix-imports` task converts all import aliases to relative imports. This is a custom implementation that may not cover all edge cases. If you run into import issues, file an issue [here](https://github.com/Jkotheimer/TypescriptServerStarterKit/issues).

## Development

### API

This starter kit uses [expressjs](https://expressjs.com/en/4x/api.html). All express routes are defined in [src/api/index.ts](./src/api/index.ts). Best practice is to define your api functions in siloed modules, then import those modules into the index file to allocate to a router endpoint. Examples are provided.

### Database

This starter it uses [mysql](https://www.npmjs.com/package/mysql) for the default database connection. If you need to use a different database, feel free to fork this project and change it up.

The database modules in this project use the repository design pattern. The idea is that each database module exposes abstract methods that allow different services to interact with one or many tables in the database. These methods should handle all pre and post processing, like building queries and resolving joins.

## Backlog

-   Create a script to generate keys for the following security uses:
    -   SSL Cert
