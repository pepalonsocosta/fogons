import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __sqliteDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (global.__sqliteDb) return global.__sqliteDb;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "fogons.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      prep_time_minutes INTEGER NOT NULL,
      cook_time_minutes INTEGER NOT NULL,
      total_time_minutes INTEGER NOT NULL,
      recommended_servings INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_per_serving REAL NOT NULL,
      unit TEXT NOT NULL,
      prep_note TEXT,
      category TEXT,
      is_optional INTEGER DEFAULT 0,
      PRIMARY KEY (recipe_id, id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      recipe_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      phase TEXT NOT NULL,
      instruction TEXT NOT NULL,
      tip TEXT,
      timer_seconds INTEGER NOT NULL,
      ingredients_json TEXT NOT NULL,
      PRIMARY KEY (recipe_id, step_number),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL,
      servings_cooked INTEGER NOT NULL,
      total_duration_seconds INTEGER,
      completed_at TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const recipeColumns = db
    .prepare("PRAGMA table_info(recipes)")
    .all() as Array<{ name: string }>;
  if (!recipeColumns.some((column) => column.name === "status")) {
    db.exec(
      "ALTER TABLE recipes ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
    );
  }

  global.__sqliteDb = db;
  return db;
}
