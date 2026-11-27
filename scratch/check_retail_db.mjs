import sqlite3 from "node:sqlite";

const db = new sqlite3.DatabaseSync("data/trinayaa.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name).join(", "));

try {
  const branches = db.prepare("SELECT * FROM retail_branches").all();
  console.log("Branches:", branches);
} catch (e) {
  console.log("Error querying branches:", e.message);
}

try {
  const users = db.prepare("SELECT * FROM users").all();
  console.log("Users in DB:", users);
} catch (e) {
  console.log("Error querying users:", e.message);
}

