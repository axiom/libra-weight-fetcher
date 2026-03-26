dev:
    bun run dev

fetch-weights:
    bun run fetch-weights

write-json:
    bun run write-json

format:
    biome format --write bin src *.json *.ts
    nix fmt
