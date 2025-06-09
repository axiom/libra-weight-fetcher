dev:
	caddy file-server -r dist --listen :3000

fetch-weights:
	bun ./fetch-weights.ts

write-json:
	bun ./write-json.ts
