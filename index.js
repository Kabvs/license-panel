const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

const db = new sqlite3.Database("./licenses.db");

db.run(`
CREATE TABLE IF NOT EXISTS licenses (
    license TEXT PRIMARY KEY,
    chwid TEXT,
    activated INTEGER DEFAULT 0
)
`);

function generateLicense() {
    return (
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 8).toUpperCase()
    );
}

// GENERATE LICENSE
app.get("/generate", (req, res) => {
    const license = generateLicense();

    db.run(
        "INSERT INTO licenses (license, chwid, activated) VALUES (?, NULL, 0)",
        [license]
    );

    res.json({ license });
});

// ACTIVATE LICENSE
app.post("/activate", (req, res) => {
    const { license, chwid } = req.body;

    db.get(
        "SELECT * FROM licenses WHERE license = ?",
        [license],
        (err, row) => {
            if (!row) return res.json({ valid: false, reason: "not_found" });

            if (row.activated === 1) {
                return res.json({ valid: false, reason: "already_used" });
            }

            db.run(
                "UPDATE licenses SET chwid = ?, activated = 1 WHERE license = ?",
                [chwid, license]
            );

            return res.json({ valid: true });
        }
    );
});

// CHECK
app.post("/check", (req, res) => {
    const { license, chwid } = req.body;

    db.get(
        "SELECT * FROM licenses WHERE license = ?",
        [license],
        (err, row) => {
            if (!row) return res.json({ valid: false });

            if (row.chwid !== chwid) {
                return res.json({ valid: false });
            }

            return res.json({ valid: true });
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
