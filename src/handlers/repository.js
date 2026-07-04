const { postMessage } = require("../slackClient");

async function handleRepository(payload) {
    const { action, repository } = payload;

    if (action !== "created") return;

    const visibility = repository.private ? "private" : "public";
    await postMessage(
        `*New repo created:* <${repository.html_url}|${repository.full_name}> (${visibility})`
    );
}

module.exports = { handleRepository };
