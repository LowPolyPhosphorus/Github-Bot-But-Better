const {
  postMessage,
  getOrCreateDailyThread,
  updateMessage,
  todayLabel,
} = require("../slackClient");

const SUMMARY_MARKER = "📊 Actions Summary";

function buildSummaryText(date, counts) {
  const extras = counts.other > 0 ? ` | ⏭️ ${counts.other}` : "";
  return `${SUMMARY_MARKER} — ${date}\nTotal: ${counts.total} runs | ✅ ${counts.success} passed | ❌ ${counts.failure} failed${extras}`;
}

function parseSummary(text) {
  const match = text.match(
    /Total:\s*(\d+)\s*runs\s*\|\s*✅\s*(\d+)\s*passed\s*\|\s*❌\s*(\d+)\s*failed(?:\s*\|\s*⏭️\s*(\d+))?/
  );
  if (!match) return null;
  return {
    total: parseInt(match[1], 10),
    success: parseInt(match[2], 10),
    failure: parseInt(match[3], 10),
    other: parseInt(match[4] || "0", 10),
  };
}

async function handleWorkflowRun(payload) {
  const { action, workflow_run: run, repository } = payload;

  if (action !== "completed") return; // ignore "requested"/"in_progress"

  const conclusion = run.conclusion; // success | failure | cancelled | skipped | ...

  // 1. Immediate alert on failure — the thing you actually want to know fast.
  if (conclusion === "failure") {
    await postMessage(
      `*Workflow failed:* <${run.html_url}|${run.name}> on \`${run.head_branch}\` in *${repository.name}*`
    );
  }

  // 2. Running daily summary — one message, edited in place through the day.
  const date = todayLabel();
  const parent = await getOrCreateDailyThread(
    SUMMARY_MARKER,
    buildSummaryText(date, { total: 0, success: 0, failure: 0, other: 0 })
  );

  const counts = parseSummary(parent.text) || {
    total: 0,
    success: 0,
    failure: 0,
    other: 0,
  };

  counts.total += 1;
  if (conclusion === "success") counts.success += 1;
  else if (conclusion === "failure") counts.failure += 1;
  else counts.other += 1;

  await updateMessage(parent.ts, buildSummaryText(date, counts));
}

module.exports = { handleWorkflowRun };
