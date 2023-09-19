# Sample Codebase GULP

This is a sample code-base for gulp

## Requirements

* [NodeJS 12.x+ installed](https://nodejs.org/en/download/releases/);

## Setup process
### Install dependencies
```bash
npm i or npm install
```

### Local development

```bash
gulp serve
```

If the previous command ran successfully you should now be able to hit the following local endpoint to invoke your function `https://localhost:9000/`


## SAM and AWS CLI commands

All commands used throughout this document

```bash
# Build gulp
npm run build 

# run gulp in test environment
npm run serve:test

# run gulp in test production
npm run serve:dist

```

**NOTE**: Alternatively this could be part of package.json scripts section.
