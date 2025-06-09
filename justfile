dev:
	caddy file-server -r dist --listen :3000

fetch-weights:
	bun ./fetch-weights.ts

write-json:
	bun ./write-json.ts

format:
	bunx prettier -w fetch-weights.ts write-json.ts dist/index.html dist/calendar.html
	nix fmt
