import express from "express";
import db from "#db/client";
const app = express();
export default app;

app.use(express.json());

app.get("/folders", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM folders;");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/files", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT files.*, folders.name AS folder_name 
      FROM files JOIN folders ON files.folder_id = folders.id;`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/folders/:id", async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const result = await db.query(
      `
     SELECT folders.*, COALESCE(json_agg(files.*) 
     FILTER (WHERE files.id IS NOT NULL),
    '[]'::json) 
    AS files
    FROM folders
    LEFT JOIN files ON files.folder_id = folders.id
    WHERE folders.id = $1
    GROUP BY folders.id;
`,
      [folderId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get("/folders/:id", async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const result = await db.query(
      `
      SELECT folders.*, COALESCE(json_agg(files.*) 
      FILTER (WHERE files.id IS NOT NULL),
      '[]'::json) 
      AS files
      FROM folders
      LEFT JOIN files ON files.folder_id = folders.id
      WHERE folders.id = $1
      GROUP BY folders.id;
    `,
      [folderId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/folders/:id/files", async (req, res, next) => {
  try {
    if (!req.body) return res.sendStatus(400);
    const { name, size } = req.body;
    if (!name || size === undefined) return res.sendStatus(400);

    const folderId = req.params.id;

    const folderResult = await db.query(
      "SELECT * FROM folders WHERE id = $1;",
      [folderId],
    );

    if (folderResult.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const result = await db.query(
      `INSERT INTO files (name, size, folder_id) 
      VALUES ($1, $2, $3) 
      RETURNING *;`,
      [name, size, req.params.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
