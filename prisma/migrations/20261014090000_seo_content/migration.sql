-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ORIGINAL', 'AI_DRAFT', 'REVIEWED');

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "content" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "seoDesc" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "content" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intro" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoDesc" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "contentStatus" "ContentStatus" NOT NULL DEFAULT 'ORIGINAL',
ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "gtin" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "seoDesc" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 301,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_from_key" ON "Redirect"("from");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_productId_userId_key" ON "Review"("productId", "userId");

