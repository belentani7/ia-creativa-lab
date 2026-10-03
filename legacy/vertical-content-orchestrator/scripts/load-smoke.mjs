const baseUrl = process.env.LOAD_BASE_URL ?? "http://127.0.0.1:3000";
const total = Number(process.env.LOAD_REQUESTS ?? 20);
const started = performance.now();
const results = await Promise.all(Array.from({ length: total }, () => fetch(`${baseUrl}/api/trpc/auth.me?batch=1&input=%7B%7D`)));
const elapsed = performance.now() - started;
const statuses = results.map(response => response.status);
const failures = statuses.filter(status => status >= 500);
if (failures.length > 0) throw new Error(`${failures.length} respuestas 5xx`);
console.log(JSON.stringify({ total, elapsedMs: Math.round(elapsed), statuses }));
