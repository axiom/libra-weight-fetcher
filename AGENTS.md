# Libra Weight Fetcher

Weight change tracker application that tracks the weight of a human user and
compares that with a target date and weight.

## Tech

- Bun, TypeScript (`tsgo` go compiler version)
- SolidJS, UnoCSS for styling
- ECharts (and echarts-solid wrapper) to visualize weight data
- GitHub actions to fetch weight data and build JSON
- Cloudflare pages to serve static files
- [Libra APP API](https://libra-app.eu)
- Withings scale and API as source of weight data.

### Tests and lints

- Run tests with `bun run test`
- Run type-checking with `tsgo`
- Run above plus lint checks with `just check`

### Code style

Pure logic is put into pure functions that are tested.

TypeScript `any` or `unknowns` types are to be avoided, type redefinitions are
to be avoided and instead we refer to existing types.

### Questions

Ask user questions using the questions interface, do not ask very many questions
in a single go, instead if there are many questions iterate through multiple
question prompts and have answers inform follow-up questions.
