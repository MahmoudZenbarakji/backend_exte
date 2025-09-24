-- AlterTable
ALTER TABLE "product_variants" ALTER COLUMN "sku" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;
