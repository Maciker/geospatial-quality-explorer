import { createApiServer } from "./server.js";

const port = Number.parseInt(process.env.PORT ?? "8000", 10);
const host = process.env.HOST ?? "127.0.0.1";

const server = createApiServer();
server.listen(port, host, () => {
  console.log(`geospatial-quality-explorer-api listening on http://${host}:${port}`);
});
