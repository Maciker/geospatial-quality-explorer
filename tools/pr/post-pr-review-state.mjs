/**
 * Portable post-PR review state machine.
 *
 * Provider adapters collect the PR snapshot, diff, checks, comments and reviews.
 * This module evaluates that evidence without calling GitHub, Cursor or any model.
 */
export const POST_PR_REVIEW_STATUSES = Object.freeze([
  "APPROVED",
  "CHANGES_REQUESTED",
  "PENDING",
  "BLOCKED",
]);

const pendingValues = new Set(["queued", "in_progress", "pending", "waiting", "requested"]);
const successfulConclusions = new Set(["success", "neutral", "skipped"]);

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function statusResult(status, reasons, evidence, findings = []) {
  return { schemaVersion: 1, status, reasons, findings, evidence };
}

function normalizeFinding(finding, fallbackSeverity = "P2") {
  const severity = stringValue(finding?.severity) || fallbackSeverity;
  return {
    severity,
    file: stringValue(finding?.file) || "unknown",
    line: Number.isInteger(finding?.line) ? finding.line : null,
    problem: stringValue(finding?.problem ?? finding?.message) || "Unspecified finding",
    whyItMatters: stringValue(finding?.whyItMatters ?? finding?.why_it_matters),
    suggestedFix: stringValue(finding?.suggestedFix ?? finding?.suggested_fix),
    // Blocking findings are always actionable; otherwise P3 is informational unless marked actionable.
    actionable: finding?.actionable === true || (finding?.actionable !== false && severity !== "P3"),
    source: stringValue(finding?.source) || "post-pr-review",
  };
}

function reviewFindings(review) {
  const findings = [];
  for (const finding of review?.findings ?? []) findings.push(normalizeFinding(finding));
  for (const finding of review?.blocking_findings ?? []) {
    findings.push(normalizeFinding({ ...finding, actionable: true }, finding?.severity ?? "P1"));
  }
  for (const finding of review?.non_blocking_findings ?? []) {
    findings.push(normalizeFinding(finding, finding?.severity ?? "P3"));
  }
  for (const missingTest of review?.missing_tests ?? review?.missingTests ?? []) {
    findings.push(normalizeFinding({
      severity: "P2",
      file: "tests",
      problem: String(missingTest),
      whyItMatters: "The PR lacks evidence for this behavior.",
      suggestedFix: "Add or update the corresponding test.",
      actionable: true,
      source: "missing-test",
    }, "P2"));
  }
  return findings;
}

function observedChecks(checks) {
  const items = Array.isArray(checks?.items) ? checks.items : [];
  return items.map((check) => ({
    name: stringValue(check?.name) || "unnamed-check",
    required: check?.required !== false,
    status: stringValue(check?.status).toLowerCase() || "unknown",
    conclusion: stringValue(check?.conclusion).toLowerCase() || "unknown",
    url: stringValue(check?.url ?? check?.detailsUrl) || null,
  }));
}

function evidenceSummary(input, pr, diff, checks, comments, reviews, reviewer, implementer) {
  return {
    pr: {
      number: pr.number,
      url: pr.url,
      baseSha: pr.baseSha,
      headSha: pr.headSha,
      currentBaseSha: input.current?.baseSha ?? null,
      currentHeadSha: input.current?.headSha ?? null,
    },
    diff: {
      complete: diff.complete === true,
      baseSha: diff.baseSha ?? null,
      headSha: diff.headSha ?? null,
      fileCount: Array.isArray(diff.files) ? diff.files.length : 0,
      digest: stringValue(diff.digest) || null,
    },
    checks: {
      status: stringValue(checks.status).toLowerCase() || "unknown",
      requiredCount: checks.requiredCount ?? checks.items?.filter((item) => item.required !== false).length ?? 0,
      items: observedChecks(checks),
    },
    commentsObserved: (Array.isArray(comments) ? comments : []).map((comment) => ({
      id: comment?.id ?? null,
      author: stringValue(comment?.author) || null,
      createdAt: comment?.createdAt ?? null,
      url: stringValue(comment?.url) || null,
    })),
    reviewsObserved: (Array.isArray(reviews) ? reviews : []).map((reviewItem) => ({
      id: reviewItem?.id ?? null,
      author: stringValue(reviewItem?.author) || null,
      state: stringValue(reviewItem?.state).toUpperCase() || "UNKNOWN",
      resolved: reviewItem?.resolved === true,
      submittedAt: reviewItem?.submittedAt ?? null,
      url: stringValue(reviewItem?.url) || null,
    })),
    reviewer: {
      identity: stringValue(reviewer.identity) || null,
      provider: stringValue(reviewer.provider) || null,
      model: stringValue(reviewer.model) || null,
      verified: reviewer.verified === true,
      independent: reviewer.independent === true,
    },
    implementer: {
      identity: stringValue(implementer.identity) || null,
      provider: stringValue(implementer.provider) || null,
      model: stringValue(implementer.model) || null,
      verified: implementer.verified === true,
    },
  };
}

export function evaluatePostPrReview(input) {
  const pr = input?.pr ?? {};
  const current = input?.current ?? {};
  const diff = input?.diff ?? {};
  const checks = input?.checks ?? {};
  const review = input?.review ?? {};
  const comments = input?.comments ?? [];
  const reviews = input?.reviews ?? [];
  const reviewer = review.reviewer ?? input?.reviewer ?? {};
  const implementer = review.implementer ?? input?.implementer ?? {};
  const evidence = evidenceSummary(input ?? {}, pr, diff, checks, comments, reviews, reviewer, implementer);
  const findings = reviewFindings(review);

  if (!Number.isInteger(pr.number) || pr.number < 1 || !stringValue(pr.url)) {
    return statusResult("BLOCKED", ["pr_identity_missing"], evidence, findings);
  }
  if (!/^[0-9a-f]{40}$/i.test(stringValue(pr.baseSha)) || !/^[0-9a-f]{40}$/i.test(stringValue(pr.headSha))) {
    return statusResult("BLOCKED", ["pr_sha_missing"], evidence, findings);
  }
  if (stringValue(current.baseSha) !== pr.baseSha || stringValue(current.headSha) !== pr.headSha) {
    return statusResult("BLOCKED", ["sha_changed_or_stale_evidence"], evidence, findings);
  }
  if (diff.complete !== true || diff.baseSha !== pr.baseSha || diff.headSha !== pr.headSha) {
    return statusResult("BLOCKED", ["complete_diff_evidence_missing"], evidence, findings);
  }
  if (reviewer.verified !== true || !stringValue(reviewer.identity)) {
    return statusResult("BLOCKED", ["reviewer_identity_unverified"], evidence, findings);
  }
  if (implementer.verified !== true || !stringValue(implementer.identity)) {
    return statusResult("BLOCKED", ["implementer_identity_unverified"], evidence, findings);
  }
  if (reviewer.independent !== true || reviewer.identity === implementer.identity) {
    return statusResult("BLOCKED", ["reviewer_is_not_independent"], evidence, findings);
  }
  if (!["pass", "iterate", "stop"].includes(stringValue(review.decision).toLowerCase())) {
    return statusResult("BLOCKED", ["review_decision_missing"], evidence, findings);
  }

  const checkItems = observedChecks(checks);
  const checksStatus = stringValue(checks.status).toLowerCase();
  const requiredChecks = checkItems.filter((check) => check.required);
  if (checksStatus === "failed") {
    return statusResult("BLOCKED", ["required_check_failed"], evidence, findings);
  }
  if (checksStatus === "pending") {
    return statusResult("PENDING", ["required_checks_pending"], evidence, findings);
  }
  if (!["complete", "none"].includes(checksStatus)) {
    return statusResult("BLOCKED", ["checks_status_invalid"], evidence, findings);
  }
  // "complete" must be backed by at least one observed required check; use "none" for a
  // repository that genuinely has no required checks.
  if (checksStatus === "complete" && requiredChecks.length === 0) {
    return statusResult("BLOCKED", ["required_check_evidence_missing"], evidence, findings);
  }
  if (checksStatus === "complete" && requiredChecks.some((check) => !successfulConclusions.has(check.conclusion))) {
    const pending = requiredChecks.some((check) => pendingValues.has(check.status) || pendingValues.has(check.conclusion));
    return statusResult(pending ? "PENDING" : "BLOCKED", [pending ? "required_checks_pending" : "required_check_failed"], evidence, findings);
  }
  if (checksStatus === "none" && Number(checks.requiredCount ?? 0) > 0) {
    return statusResult("BLOCKED", ["required_check_evidence_missing"], evidence, findings);
  }

  const publication = input?.publication ?? {};
  const publicationStatus = stringValue(publication.status).toLowerCase();
  if (publicationStatus !== "published" || !stringValue(publication.url)) {
    return statusResult(publicationStatus === "failed" ? "BLOCKED" : "PENDING", [
      publicationStatus === "failed" ? "review_publication_failed" : "review_evidence_not_published",
    ], evidence, findings);
  }

  const unresolvedExternalChanges = reviews.some((reviewItem) =>
    stringValue(reviewItem?.state).toUpperCase() === "CHANGES_REQUESTED" && reviewItem?.resolved !== true,
  );
  if (stringValue(review.decision).toLowerCase() === "stop") {
    return statusResult("BLOCKED", ["reviewer_stop_decision"], evidence, findings);
  }
  if (stringValue(review.decision).toLowerCase() === "iterate" || unresolvedExternalChanges || findings.some((finding) => finding.actionable)) {
    return statusResult("CHANGES_REQUESTED", [
      ...(stringValue(review.decision).toLowerCase() === "iterate" ? ["reviewer_requested_iteration"] : []),
      ...(unresolvedExternalChanges ? ["existing_changes_requested_review"] : []),
      ...(findings.some((finding) => finding.actionable) ? ["actionable_findings_present"] : []),
    ], evidence, findings);
  }

  return statusResult("APPROVED", ["review_clean_and_checks_complete"], evidence, findings);
}
