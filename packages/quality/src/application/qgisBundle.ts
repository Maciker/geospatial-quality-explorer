import type { ValidationRun } from "../domain/geometry.js";
import { buildQualityReport } from "./qualityReport.js";

type QgisBundle = {
  readonly geojson: string;
  readonly metadata: string;
  readonly project: string;
  readonly style: string;
};

export function buildQgisBundle(run: ValidationRun): QgisBundle {
  const report = buildQualityReport(run);
  const features = run.findings.map((finding) => ({
    type: "Feature",
    id: finding.findingId,
    properties: {
      findingId: finding.findingId,
      ruleId: finding.ruleId,
      severity: finding.severity,
      featureId: finding.featureId,
      explanation: finding.explanation,
      suggestedAction: finding.suggestedAction,
    },
    geometry: finding.geometry,
  }));
  return {
    geojson: `${JSON.stringify({ type: "FeatureCollection", features }, null, 2)}\n`,
    metadata: `${JSON.stringify(report, null, 2)}\n`,
    project: qgisProject(),
    style: qgisStyle(),
  };
}

function qgisProject(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qgis version="3.34.0" projectname="Quality findings">
  <title>Quality findings</title>
  <projectCrs>
    <spatialrefsys>
      <authid>EPSG:4326</authid>
      <srid>4326</srid>
    </spatialrefsys>
  </projectCrs>
  <layer-tree-group>
    <layer-tree-layer source="./findings.geojson" providerKey="ogr" name="findings" checked="Qt::Checked"/>
  </layer-tree-group>
  <projectlayers>
    <maplayer type="vector" geometry="Unknown">
      <id>findings</id>
      <datasource>./findings.geojson</datasource>
      <layername>findings</layername>
      <provider>ogr</provider>
      <field name="severity"/>
      <field name="ruleId"/>
    </maplayer>
  </projectlayers>
</qgis>
`;
}

function qgisStyle(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qgis version="3.34.0">
  <renderer-v2 type="categorizedSymbol" attr="severity">
    <categories>
      <category value="error" label="error" symbol="0"/>
      <category value="warning" label="warning" symbol="1"/>
      <category value="info" label="info" symbol="2"/>
    </categories>
  </renderer-v2>
</qgis>
`;
}
