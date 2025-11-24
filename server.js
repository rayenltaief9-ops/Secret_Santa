// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== DATA ======
const people = ["alice", "rayen", "hannagh", "martina", "sasha", "will", "fabi", "arian", "ayumi"];

// Data folder for persistence
const dataDir = path.join(__dirname, "data");
const assignmentsFile = path.join(dataDir, "assignments.json");
const seenFile = path.join(dataDir, "seen.json");

// In-memory mirrors
let assignments = {};
let seen = new Set();

// ====== HELPERS ======
function shuffle(arr) {
  const crypto = require("crypto");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Derangement: no one gets themselves, everyone gets unique target
function derange(list) {
  let out;
  let tries = 0;
  do {
    out = shuffle([...list]);
    tries++;
    if (tries > 5000) throw new Error("Could not create derangement");
  } while (out.some((v, i) => v === list[i]));

  const result = {};
  list.forEach((name, i) => {
    result[name] = out[i];
  });
  return result;
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
}

function loadJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function saveJSON(filePath, data) {
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  });
}

// ====== INITIALIZATION ======
function initState() {
  ensureDataDir();

  // 1) Load or create assignments
  const loadedAssignments = loadJSON(assignmentsFile, null);
  if (loadedAssignments && typeof loadedAssignments === "object") {
    assignments = loadedAssignments;
    console.log("Loaded existing assignments ✅");
  } else {
    assignments = derange(people);
    saveJSON(assignmentsFile, assignments);
    console.log("Generated new assignments ✅");
  }

  // 2) Load or create seen list
  const seenList = loadJSON(seenFile, []);
  seen = new Set(seenList);
  console.log("Loaded seen list:", [...seen]);
}

initState();

// ====== FRONTEND ======
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== API ======
app.get("/api/target", (req, res) => {
  const giverRaw = (req.query.giver || "").toLowerCase();

  // Validate name
  if (!people.includes(giverRaw)) {
    return res.status(400).json({ error: "unknown_giver" });
  }

  // Check if this name already rolled (any device, any tab)
  if (seen.has(giverRaw)) {
    return res.status(400).json({ error: "already_played" });
  }

  const target = assignments[giverRaw];

  if (!target) {
    // Should never happen if derangement is correct, but just in case
    return res.status(500).json({ error: "no_assignment" });
  }

  // Mark this giver as having played
  seen.add(giverRaw);
  saveJSON(seenFile, Array.from(seen));

  return res.json({ target });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} 🎄`);
});