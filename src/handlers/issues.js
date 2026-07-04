const { postMessage } = require("../slackClient");

async function handleIssues(payload) {
    const { action, issue, repository } = payload;

    if (action !== "opened") return;

    await postMessage(
        `*New Issue* <${issue.html_url}|#${issue.number} ${issue.title}> opened in *${repository.name}*`
    );
}

module.exports = { handleIssues };