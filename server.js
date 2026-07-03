require("dotenv").config();
const express = require("express");

const { verifySignature } = require("./src/verifySignature");
const { handlePullRequest } = require("./src/handlers/pullRequest");
const { handleIssues } = require("./src/handlers/issues");
const { handleRepository } = require("./src/handlers/repository");
const { handlePush } = require("./src/handlers/push");
const { handleWorkflowRun } = require("./src/handlers/workflowRun");

const app = express();

// Capture the raw body so we can verify GitHub's HMAC signature.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Map GitHub event names -> handler functions.
// To "link in more" later, add an entry here and a file in src/handlers/.
const EVENT_HANDLERS = {
  pull_request: handlePullRequest,
  issues: handleIssues,
  repository: handleRepository,
  push: handlePush,
  workflow_run: handleWorkflowRun,
};

app.post("/github/webhook", verifySignature, async (req, res) => {
  const eventName = req.get("X-GitHub-Event");
  const handler = EVENT_HANDLERS[eventName];

  // Always ack quickly so GitHub doesn't retry/timeout on us.
  res.status(200).send("ok");

  if (!handler) return; // event we don't care about (or "ping" on setup)

  try {
    await handler(req.body);
  } catch (err) {
    console.error(`Error handling ${eventName} event:`, err);
  }
});

app.get("/", (_req, res) => {
  res.send("better-github-bot is running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`better-github-bot listening on port ${port}`);
});
