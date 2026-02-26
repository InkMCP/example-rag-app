const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'rag.db');
const EMBEDDING_DIM = 1536;

let db;

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  sqliteVec.load(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
      id INTEGER PRIMARY KEY,
      embedding float[${EMBEDDING_DIM}]
    )
  `);

  return db;
}

function insertDocument(filename, content) {
  const result = getDb().prepare(
    'INSERT INTO documents (filename, content) VALUES (?, ?)'
  ).run(filename, content);
  return result.lastInsertRowid;
}

function insertChunk(documentId, chunkText, chunkIndex) {
  const result = getDb().prepare(
    'INSERT INTO chunks (document_id, chunk_text, chunk_index) VALUES (?, ?, ?)'
  ).run(documentId, chunkText, chunkIndex);
  return result.lastInsertRowid;
}

function insertVecChunk(chunkId, embedding) {
  const buffer = Buffer.from(new Float32Array(embedding).buffer);
  getDb().prepare(
    'INSERT INTO vec_chunks (id, embedding) VALUES (?, ?)'
  ).run(chunkId, buffer);
}

function searchSimilar(queryEmbedding, topK = 5) {
  const buffer = Buffer.from(new Float32Array(queryEmbedding).buffer);
  const rows = getDb().prepare(`
    SELECT v.id, v.distance, c.chunk_text, c.chunk_index, d.filename
    FROM vec_chunks v
    JOIN chunks c ON c.id = v.id
    JOIN documents d ON d.id = c.document_id
    WHERE v.embedding MATCH ?
    ORDER BY v.distance
    LIMIT ?
  `).all(buffer, topK);
  return rows;
}

function listDocuments() {
  return getDb().prepare(
    'SELECT id, filename, created_at FROM documents ORDER BY created_at DESC'
  ).all();
}

function deleteDocument(id) {
  const chunkIds = getDb().prepare(
    'SELECT id FROM chunks WHERE document_id = ?'
  ).all(id).map(r => r.id);

  for (const chunkId of chunkIds) {
    getDb().prepare('DELETE FROM vec_chunks WHERE id = ?').run(chunkId);
  }

  getDb().prepare('DELETE FROM chunks WHERE document_id = ?').run(id);
  getDb().prepare('DELETE FROM documents WHERE id = ?').run(id);
}

module.exports = {
  getDb,
  insertDocument,
  insertChunk,
  insertVecChunk,
  searchSimilar,
  listDocuments,
  deleteDocument
};
