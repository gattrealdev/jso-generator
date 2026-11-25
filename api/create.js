
import { randomUUID } from "node:crypto";

const scripts = new Map();

export default async function handler(req, res) {
    // Generate JavaScript
    if (req.method === "POST") {
        const { html } = req.body || {};

        if (typeof html !== "string" || !html.trim()) {
            return res.status(400).json({
                error: "HTML tidak boleh kosong"
            });
        }

        const id = randomUUID().slice(0, 12);

        scripts.set(id, html);

        return res.status(200).json({
            success: true,
            id,
            url: `${process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "https://" + req.headers.host}/js/${id}.js`
        });
    }

    // Serve JavaScript
    if (req.method === "GET") {
        const id = req.query.id;
        const html = scripts.get(id);

        if (!html) {
            return res.status(404).send("// Script not found");
        }

        const safeHTML = JSON.stringify(html);

        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");

        return res.send(`
(function() {
    const html = ${safeHTML};
    document.body.insertAdjacentHTML("beforeend", html);
})();
        `);
    }

    return res.status(405).json({
        error: "Method not allowed"
    });
}
