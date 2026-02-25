/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "createdAt",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Employee_id_seq";
