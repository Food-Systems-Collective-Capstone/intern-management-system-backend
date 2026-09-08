## SPECIFICATIONS

| Technology | Usage | Version |
| -------- | -------- | -------------- |
| NodeJS  | Runtime environment | 24 |
| pnpm  | JS/NodeJS Package manager | 11.22.0 |
| NestJs | Backend framework  | 19 |
| PostgreSQL | Shared database  | 17.6 |
| Render | Backend cloud deployment  | N/A |
| Supabase  | Database hosting | N/A |


## ENVIRONMENT VARIABLES

| VARIABLE | SECRET | VALUE | Description |
| -------- | -------- | -------------- | ----------- |
| DATABASE_URL  | Yes | postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION][.pooler.supabase.com:5432/postgres](https://.pooler.supabase.com:5432/postgres) | Connection string using Supabase session pooler for persistent NestJs backend connections |
| SUPABASE_URL | Yes | https://[project_id].supabase.co | URL of Supabase project, used to initialise Supabase client for Storage and authentication features|
| SUPABASE_KEY | Yes | API SECRET KEY | Supabase secret API key which grants admin access, ONLY USED FOR BACKEND | 
| Render URL | No | https://intern-management-system-backend-1.onrender.com/ | Live URL for deployed NestJs backend on Render | 



## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.Ensure you have NodeJS/24 and pnpm/11.22.0 (or version listed in package.json)

Also create a /.env file in the root directory and fill in necessary variables, found in /.env.example

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Build

```bash
$ pnpm build
```

### Lint

```bash
$ pnpm lint
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
