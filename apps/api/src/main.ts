import { createApiServer, assertLoopbackHost } from "./server.js";
import {
  InMemoryValidationRunRepository,
  InProcessValidationJobs,
  PlanarPolygonEngine,
  Sha256Digest,
} from "../../../packages/quality/src/index.js";
import { openPostgis } from "../../../packages/persistence/src/index.js";

const port = Number.parseInt(process.env.PORT ?? "8000", 10);
const host = process.env.HOST ?? "127.0.0.1";
assertLoopbackHost(host);

const databaseUrl = process.env.GEOSPATIAL_POSTGIS_URL;
const repository = databaseUrl
  ? (await openPostgis(databaseUrl)).repository
  : new InMemoryValidationRunRepository();
const jobs = new InProcessValidationJobs(repository, new PlanarPolygonEngine(), new Sha256Digest(), () => new Date());
const server = createApiServer({ repository, jobs });
server.listen(port, host, () => {
  console.log(`geospatial-quality-explorer-api listening on http://${host}:${port}`);
});
