const crypto = require ("crypto");

function verifySignature(req, res, next) {
    const signature = req.get("X-Hub-Signature-256");
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signature || !secret) {
        return res.status(401).send("Missing signature or secret")
    }

    const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(401).send("Invalid signature");
    }

    next();
}

module.exports = { verifySignature };
