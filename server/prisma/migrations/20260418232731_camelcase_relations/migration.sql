/*
  Warnings:

  - The primary key for the `order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customer_name` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `preparation_status` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `store_number` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `tax_percent` on the `order` table. All the data in the column will be lost.
  - The primary key for the `order_item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `item_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `order_item_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `price_at_purchase` on the `order_item` table. All the data in the column will be lost.
  - The primary key for the `orderable_item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_available` on the `orderable_item` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `orderable_item` table. All the data in the column will be lost.
  - You are about to drop the column `item_type` on the `orderable_item` table. All the data in the column will be lost.
  - The primary key for the `package` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bundle_price` on the `package` table. All the data in the column will be lost.
  - You are about to drop the column `package_id` on the `package` table. All the data in the column will be lost.
  - The primary key for the `package_product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `package_id` on the `package_product` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `package_product` table. All the data in the column will be lost.
  - The primary key for the `product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `base_price` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `product` table. All the data in the column will be lost.
  - The primary key for the `product_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type_id` on the `product_type` table. All the data in the column will be lost.
  - The primary key for the `restaurant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address_id` on the `restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `store_number` on the `restaurant` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeNumber` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxPercent` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderItemId` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAtPurchase` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `orderable_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemType` to the `orderable_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bundlePrice` to the `package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageId` to the `package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageId` to the `package_product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `package_product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `product_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressId` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeNumber` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_store_number_fkey`;

-- DropForeignKey
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `package` DROP FOREIGN KEY `package_package_id_fkey`;

-- DropForeignKey
ALTER TABLE `package_product` DROP FOREIGN KEY `package_product_package_id_fkey`;

-- DropForeignKey
ALTER TABLE `package_product` DROP FOREIGN KEY `package_product_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_type_id_fkey`;

-- DropIndex
DROP INDEX `order_store_number_fkey` ON `order`;

-- DropIndex
DROP INDEX `order_item_item_id_fkey` ON `order_item`;

-- DropIndex
DROP INDEX `order_item_order_id_fkey` ON `order_item`;

-- DropIndex
DROP INDEX `package_product_package_id_fkey` ON `package_product`;

-- DropIndex
DROP INDEX `product_type_id_fkey` ON `product`;

-- AlterTable
ALTER TABLE `order` DROP PRIMARY KEY,
    DROP COLUMN `customer_name`,
    DROP COLUMN `order_id`,
    DROP COLUMN `preparation_status`,
    DROP COLUMN `store_number`,
    DROP COLUMN `tax_percent`,
    ADD COLUMN `customerName` VARCHAR(191) NOT NULL,
    ADD COLUMN `orderId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `preparationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `storeNumber` INTEGER NOT NULL,
    ADD COLUMN `taxPercent` DECIMAL(5, 2) NOT NULL,
    ADD PRIMARY KEY (`orderId`);

-- AlterTable
ALTER TABLE `order_item` DROP PRIMARY KEY,
    DROP COLUMN `item_id`,
    DROP COLUMN `order_id`,
    DROP COLUMN `order_item_id`,
    DROP COLUMN `price_at_purchase`,
    ADD COLUMN `itemId` INTEGER NOT NULL,
    ADD COLUMN `orderId` INTEGER NOT NULL,
    ADD COLUMN `orderItemId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `priceAtPurchase` DECIMAL(10, 2) NOT NULL,
    ADD PRIMARY KEY (`orderItemId`);

-- AlterTable
ALTER TABLE `orderable_item` DROP PRIMARY KEY,
    DROP COLUMN `is_available`,
    DROP COLUMN `item_id`,
    DROP COLUMN `item_type`,
    ADD COLUMN `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `itemType` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`itemId`);

-- AlterTable
ALTER TABLE `package` DROP PRIMARY KEY,
    DROP COLUMN `bundle_price`,
    DROP COLUMN `package_id`,
    ADD COLUMN `bundlePrice` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `packageId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`packageId`);

-- AlterTable
ALTER TABLE `package_product` DROP PRIMARY KEY,
    DROP COLUMN `package_id`,
    DROP COLUMN `product_id`,
    ADD COLUMN `packageId` INTEGER NOT NULL,
    ADD COLUMN `productId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`productId`, `packageId`);

-- AlterTable
ALTER TABLE `product` DROP PRIMARY KEY,
    DROP COLUMN `base_price`,
    DROP COLUMN `product_id`,
    DROP COLUMN `type_id`,
    ADD COLUMN `basePrice` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `productId` INTEGER NOT NULL,
    ADD COLUMN `typeId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`productId`);

-- AlterTable
ALTER TABLE `product_type` DROP PRIMARY KEY,
    DROP COLUMN `type_id`,
    ADD COLUMN `typeId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`typeId`);

-- AlterTable
ALTER TABLE `restaurant` DROP PRIMARY KEY,
    DROP COLUMN `address_id`,
    DROP COLUMN `phone_number`,
    DROP COLUMN `store_number`,
    ADD COLUMN `addressId` INTEGER NOT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `storeNumber` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`storeNumber`);

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `product_type`(`typeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `orderable_item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package` ADD CONSTRAINT `package_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `orderable_item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_product` ADD CONSTRAINT `package_product_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`productId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_product` ADD CONSTRAINT `package_product_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `package`(`packageId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_storeNumber_fkey` FOREIGN KEY (`storeNumber`) REFERENCES `Restaurant`(`storeNumber`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`orderId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `orderable_item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;
