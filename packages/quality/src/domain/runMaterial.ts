export function canonicalRunMaterial(input: {
  readonly sourceHash: string;
  readonly rulesetId: string;
  readonly rulesetVersion: string;
  readonly sourceCrs: string;
  readonly datasetName: string;
  readonly license: string;
  readonly featureCount: number;
  readonly parameters: Readonly<Record<string, string>>;
}): string {
  const parameters = Object.keys(input.parameters)
    .sort()
    .map((key) => `${key}=${input.parameters[key] ?? ""}`)
    .join("&");
  return [
    input.sourceHash,
    input.rulesetId,
    input.rulesetVersion,
    input.sourceCrs,
    input.datasetName,
    input.license,
    String(input.featureCount),
    parameters,
  ].join("\n");
}
