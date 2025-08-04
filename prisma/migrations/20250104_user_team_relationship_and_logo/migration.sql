/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "logo_path" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teams_user_id_key" ON "teams"("user_id");
