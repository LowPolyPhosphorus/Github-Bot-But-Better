const { getOrCreateDailyThread, postReply, todayLabel } = require("../slackClient");

async function handlePush(payload) {
    const { commits, repository, pusher, ref } = payload;

    if (!commits || commits.length === 0) return; // e.g. branch delete, tag push

    const branch = ref.replace("refs/heads/", "");
    const parent = await getOrCreateDailyThread(
        "Commits",
        `Commits - ${todayLabel()}\n_Today's commits land in this thread`
    );

    const lines = commits.map((c) => {
        const shortSha = c.id.slice (0, 7);
        const firstLine = c.message.split("\n")[0];
        return `• \`${shortSha}\` <${c.url}|${firstLine}>`;
    });

    const text = [
      `*${repository.name}* (\`${branch}\`) — ${commits.length} commit${commits.length > 1 ? "s" : ""} by ${pusher.name}`,
      ...lines,
    ].join("\n");

    await postReply(parent.ts, text);
}

module.exports = { handlePush };
