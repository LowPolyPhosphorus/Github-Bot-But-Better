const {
  postMessage,
  postReply,
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

  // get today's thread first, so the failure alert can reply into it
  const date = todayLabel();
  const parent = await getOrCreateDailyThread(
    SUMMARY_MARKER,
    buildSummaryText(date, { total: 0, success: 0, failure: 0, other: 0 })
  );

  // alert shall reply in the thead now!!!!!
  if (conclusion === "failure") {
    await postReply(
      parent.ts,
      `*Workflow failed:* <${run.html_url}|${run.name}> on \`${run.head_branch}\` in *${repository.name}*`
    );
  }

  // running daily sumary for one message, edited in place
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