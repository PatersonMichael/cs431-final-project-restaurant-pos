/*
  Warnings:

  - You are about to drop the column `packagePackageId` on the `inventory_transaction` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `employeeEmployeeId` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `addressAddressId` on the `restaurant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `inventory_transaction` DROP FOREIGN KEY `inventory_transaction_packagePackageId_fkey`;

-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_employeeEmployeeId_fkey`;

-- DropForeignKey
ALTER TABLE `restaurant` DROP FOREIGN KEY `restaurant_addressAddressId_fkey`;

-- DropIndex
DROP INDEX `inventory_transaction_packagePackageId_fkey` ON `inventory_transaction`;

-- DropIndex
DROP INDEX `order_employeeEmployeeId_fkey` ON `order`;

-- DropIndex
DROP INDEX `restaurant_addressAddressId_fkey` ON `restaurant`;

-- AlterTable
ALTER TABLE `inventory_transaction` DROP COLUMN `packagePackageId`;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `discount`,
    DROP COLUMN `employeeEmployeeId`,
    MODIFY `customerName` VARCHAR(191) NULL,
    MODIFY `preparationStatus` VARCHAR(191) NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE `order_item` ADD COLUMN `firedAt` DATETIME(3) NULL,
    ADD COLUMN `kitchenStatus` VARCHAR(191) NOT NULL DEFAULT 'staged';

-- AlterTable
ALTER TABLE `restaurant` DROP COLUMN `addressAddressId`;

-- AddForeignKey
ALTER TABLE `restaurant` ADD CONSTRAINT `restaurant_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `address`(`addressId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift` ADD CONSTRAINT `shift_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`roleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `electronic_payment` ADD CONSTRAINT `electronic_payment_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`paymentId`) ON DELETE RESTRICT ON UPDATE CASCADE;
