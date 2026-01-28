import "dotenv/config";
import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query("TRUNCATE TABLE files, folders RESTART IDENTITY CASCADE;");

  const insertFoldersSql = `
    INSERT INTO folders (name)
    VALUES ($1)
    RETURNING id;
  `;

  const insertFilesSql = `
  INSERT INTO files (name, size, folder_id)
  VALUES ($1, $2, $3)
  RETURNING *;
  `;

  const {
    rows: [docFolder],
  } = await db.query(insertFoldersSql, ["Documents"]);
  const {
    rows: [picFolder],
  } = await db.query(insertFoldersSql, ["Pictures"]);
  const {
    rows: [musicFolder],
  } = await db.query(insertFoldersSql, ["Music"]);

  const documentsId = docFolder.id;
  const picturesId = picFolder.id;
  const musicId = musicFolder.id;

  console.log({ documentsId, picturesId, musicId });

  const filesByFolder = {
    [documentsId]: [
      ["resume.pdf", 1200],
      ["cover-letter.docx", 850],
      ["taxes-2025.xlsx", 2400],
      ["notes.txt", 120],
      ["project-plan.md", 600],
    ],
    [picturesId]: [
      ["vacation-1.jpg", 3200],
      ["vacation-2.jpg", 4100],
      ["family.png", 2800],
      ["profile.webp", 900],
      ["screenshot.png", 1500],
    ],
    [musicId]: [
      ["song-1.mp3", 5200],
      ["song-2.mp3", 6100],
      ["podcast-ep1.mp3", 48000],
      ["beat.wav", 25000],
      ["mixdown.aac", 7000],
    ],
  };
  //goes through each folder in filesByFolder
  for (const [folderIdStr, files] of Object.entries(filesByFolder)) {
    const folderId = Number(folderIdStr);
    //goes through each file in that folder
    for (const [name, size] of files) {
      await db.query(insertFilesSql, [name, size, folderId]);
    }
  }
  const {
    rows: [filesCountRow],
  } = await db.query("SELECT COUNT(*) FROM files;");
  console.log("files count:", filesCountRow.count);
}
