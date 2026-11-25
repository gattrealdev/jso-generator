
import { randomUUID } from "node:crypto";

const scripts = new Map();

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { html } = req.body || {};

        if (typeof html !== "string" || !html.trim()) {
            return res.status(400).json({
                error: "HTML tidak boleh kosong"
            });
        }

        if (html.length > 100000) {
            return res.status(413).json({
                error: "Maksimal ukuran HTML 100 KB"
            });
        }

        const id = randomUUID().slice(0, 12);

        scripts.set(id, html);

        return res.status(201).json({
            success: true,
            id,
            url: `https://${req.headers.host}/js/${id}.js`
        });
    }

    if (req.method === "GET") {
        const id = req.query.id;
        const html = scripts.get(id);

        if (!html) {
            return res.status(404).send(
                "// Script tidak ditemukan"
            );
        }

        const payload = JSON.stringify(html);

        res.setHeader(
            "Content-Type",
            "application/javascript; charset=utf-8"
        );

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("X-Content-Type-Options", "nosniff");

        return res.send(`
(function () {
    const html = ${payload};

    const frame = document.createElement("iframe");

    frame.setAttribute("sandbox", "allow-scripts allow-modals");
    frame.style.width = "100%";
    frame.style.border = "0";
    frame.style.display = "block";

    const doc = \`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
\${html}
</body>
</html>\`;

    document.currentScript.after(frame);
    frame.srcdoc = doc;
})();
        `);
    }

    return res.status(405).json({
        error: "Method not allowed"
    });
}
