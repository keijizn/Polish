const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(
  app.getPath('userData'),
  'polish.db'
);

const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

function saveNote(content) {
  const statement = db.prepare(`
    INSERT INTO notes (content, created_at)
    VALUES (?, ?)
  `);

  const createdAt = new Date().toISOString();

  const result = statement.run(
    content,
    createdAt
  );

  return {
    id: result.lastInsertRowid,
    content,
    createdAt,
  };
}

function getNotes() {
  const statement = db.prepare(`
    SELECT id, content, created_at
    FROM notes
    ORDER BY id DESC
  `);

  return statement.all();
}

function deleteNote(id) {
  const statement = db.prepare(`
    DELETE FROM notes
    WHERE id = ?
  `);

  const result = statement.run(id);

  return result.changes > 0;
}

module.exports = {
  saveNote,
  getNotes,
  deleteNote,
};