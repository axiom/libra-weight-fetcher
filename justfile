dev:
    bun run dev

build:
    bun run build

fetch-weights:
    bun run fetch-weights

write-json:
    bun run write-json

check:
    tsgo
    bun run test
    biome check bin src/*.ts
    for f in biome.json package.json tsconfig.json; do biome check "$f"; done

format:
    biome format --write bin src *.json *.ts
    nix fmt
