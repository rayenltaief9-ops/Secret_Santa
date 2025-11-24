// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ----- DATA -----
const people = ["alice","rayen","hannagh","martina","sasha","will","fabi","arian","ayumi"];
let assignments = {};
let seen = new Set();

// ----- HELPERS -----
function shuffle(arr) {
  // Stronger randomness using crypto
  const cryptoObj = require("crypto");
  for (let i = arr.length - 1; i > 0; i--) {
    const rand = cryptoObj.randomInt(0, i + 1);
    [arr[i], arr[rand]] = [arr[rand], arr[i]];
  }
  return arr;
}

function derange(list) {
  let out;
  let tries = 0;
  do {
    out = shuffle([...list]);
    tries++;
    if (tries > 5000) throw new Error("Could not create derangement");
  } while (out.some((v, i) => v === list[i]));

  const result = {};
  list.forEach((n, i) => (result[n] = out[i]));
  return result;
}

assignments = derange(people);
console.log("Assignments created ✅");

// ===== FRONTEND SETUP =====

// Serve everything inside /public
app.use(express.static(path.join(__dirname, "public")));

// Force root "/" to serve index.html explicitly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== API =====
app.get("/api/target", (req, res) => {
  const giverRaw = (req.query.giver || "").toLowerCase();

  if (!people.includes(giverRaw)) {
    return res.status(400).json({ error: "unknown_giver" });
  }

  if (seen.has(giverRaw)) {
    return res.status(400).json({ error: "already_played" });
  }

  const target = assignments[giverRaw];
  seen.add(giverRaw);

  res.json({ target });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} 🎄`);
});