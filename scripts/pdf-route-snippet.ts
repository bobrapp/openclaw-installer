import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// PDF audit report download
// Requires: OWNER_PASSPHRASE env var set on the server
// Requires: Python 3 + qrcode + reportlab installed (pip install "qrcode[pil]" reportlab)
app.get("/api/audit/export-pdf", async (req, res) => {
  // ── Auth check ────────────────────────────────────────────────────────────
  const passphrase = req.headers["x-owner-passphrase"] as string | undefined;
  const expected = process.env.OWNER_PASSPHRASE;

  if (!expected) {
    return res.status(500).json({ error: "Server misconfiguration: OWNER_PASSPHRASE not set." });
  }
  if (!passphrase || passphrase !== expected) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing x-owner-passphrase header." });
  }

  // ── Resolve paths ─────────────────────────────────────────────────────────
  const scriptDir = path.resolve(__dirname, "../scripts");
  const scriptPath = path.join(scriptDir, "generate-audit-pdf.py");

  // DB path: prefer env var, then look next to this server's cwd
  const dbPath = process.env.OPENCLAW_DB_PATH ?? path.resolve(process.cwd(), "openclaw.db");

  // Write output to a temp file so we can stream it
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `aigovops-audit-${Date.now()}.pdf`);

  try {
    // ── Generate the PDF ───────────────────────────────────────────────────
    const python = process.env.PYTHON_BIN ?? "python3";
    const cmd = `${python} "${scriptPath}" --db "${dbPath}" --output "${tmpPdf}"`;

    execSync(cmd, {
      timeout: 60_000,            // 60 s max — large logs may take a moment
      stdio: ["ignore", "pipe", "pipe"],
    });

    // ── Verify output exists ───────────────────────────────────────────────
    if (!fs.existsSync(tmpPdf)) {
      throw new Error("PDF generation completed but output file not found.");
    }

    const stat = fs.statSync(tmpPdf);

    // ── Stream PDF back to client ──────────────────────────────────────────
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="aigovops-audit-report-${new Date().toISOString().slice(0, 10)}.pdf"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(tmpPdf);
    stream.pipe(res);

    stream.on("end", () => {
      // Clean up temp file after streaming
      try { fs.unlinkSync(tmpPdf); } catch (_) {}
    });

    stream.on("error", (err) => {
      console.error("[audit/export-pdf] Stream error:", err);
      try { fs.unlinkSync(tmpPdf); } catch (_) {}
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream PDF." });
      }
    });

  } catch (err: any) {
    // Clean up on error
    try { if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf); } catch (_) {}

    const message = err?.stderr?.toString?.() ?? err?.message ?? "Unknown error";
    console.error("[audit/export-pdf] Generation error:", message);

    if (!res.headersSent) {
      res.status(500).json({
        error: "PDF generation failed.",
        detail: message.slice(0, 500), // truncate for safety
      });
    }
  }
});
