# Contributor Metrics App

## App routes

- `/trending`
- `/pending`

**Repo Specific:**

- `/trending/{repo}`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

## Amplify Build Settings

> The Prisma client is generated using the secrets retrieved with `update-env.sh`

```
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yum -y install jq
        - jq --version
        - nvm install 16
        - yarn install
    build:
      commands:
        - bash update-env.sh
        - npx prisma generate
        - yarn run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Data

**Prisma Schema**

- `/primsa/schema.prisma`

**Postgres View Reference**

- `/sql/views.sql`
