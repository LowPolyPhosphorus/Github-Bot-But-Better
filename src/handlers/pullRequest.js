const { postMessage } = require("../slackClient");

const ACTIONS_TO_ANNOUNCE = ["opened", "reopened", "ready_for_review"];

async function handlePullRequest(payload) {
    const { action, pull_request: pr, repository } = payload;

    if (action === "closed" && pr.merged) {
        await postMessage(
            `*Merged* <${pr.html_url}|#${pr.number} ${pr.title}> in *${repository.name}*`
        );
        return;
    }

    if (!ACTIONS_TO_ANNOUNCE.includes(action)) return;

    await postMessage(
        `*New PR* <${pr.html_url}|#${pr.number} ${pr.title}> opened in *${repository.name}`
    );
}

module.exports = { handlePullRequest };