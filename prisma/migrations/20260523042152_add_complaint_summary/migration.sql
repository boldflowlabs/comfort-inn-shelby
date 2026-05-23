-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "guestName" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "contactInfo" TEXT,
    "description" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending'
);
INSERT INTO "new_Complaint" ("contactInfo", "createdAt", "description", "guestName", "id", "roomNumber", "sessionId", "status") SELECT "contactInfo", "createdAt", "description", "guestName", "id", "roomNumber", "sessionId", "status" FROM "Complaint";
DROP TABLE "Complaint";
ALTER TABLE "new_Complaint" RENAME TO "Complaint";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
