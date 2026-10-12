import type { ToolResult } from "../domain/toolErrors.js";
import type {
  ExplainFindingInput,
  ExplainFindingOutput,
  ExportQgisInput,
  ExportQgisOutput,
  ListFindingsInput,
  ListFindingsOutput,
  ListFixturesInput,
  ListFixturesOutput,
  RunValidationInput,
  RunValidationOutput,
} from "../domain/toolContracts.js";

export type QualityToolsPort = {
  listFixtures(input: ListFixturesInput): Promise<ToolResult<ListFixturesOutput>>;
  runValidation(input: RunValidationInput): Promise<ToolResult<RunValidationOutput>>;
  listFindings(input: ListFindingsInput): Promise<ToolResult<ListFindingsOutput>>;
  explainFinding(input: ExplainFindingInput): Promise<ToolResult<ExplainFindingOutput>>;
  exportQgis(input: ExportQgisInput): Promise<ToolResult<ExportQgisOutput>>;
};
