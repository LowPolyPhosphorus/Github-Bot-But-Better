const { WebClient } = require("@slack/web-api");

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const channel = process.env.SLACK_CHANNEL_ID;

async function postMessage(text) {
    return client.chat.postMessage({ channel, text, unfurl_links: false });
}

async function postReply(threadTs, text) {
    return client.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text,
        unfurl_links: false,
    });
}

async function updateMessage(ts, text) {
    return client.chat.update({ channel, ts, text });
}

function todayLabel() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function getOrCreateDailyThread(markerPrefix, initialText) {
    const dateLabel = todayLabel();
    const marker = `${markerPrefix} - ${dateLabel}`;

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const oldest = (startOfDay.getTime() / 1000).toFixed(6);

    const history = await client.conversations.history({
        channel,
        oldest,
        limit: 200,
    });

    const existing = (history.messages || []).find(
        (m) => m.text  && m.text.startsWith(marker)
    );

    if (existing) return existing;

    const created = await postMessage(initialText || `${marker}`);
    return { ts: created.ts, text: initialText || marker };
}

module.exports = {
    postMessage,
    postReply,
    updateMessage,
    getOrCreateDailyThread,
    todayLabel,
};
