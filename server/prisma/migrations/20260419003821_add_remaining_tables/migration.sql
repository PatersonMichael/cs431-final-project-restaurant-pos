-- AlterTable
ALTER TABLE `order` ADD COLUMN `employeeEmployeeId` INTEGER NULL,
    ADD COLUMN `employeeId` INTEGER NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'unpaid';

-- AlterTable
ALTER TABLE `restaurant` ADD COLUMN `addressAddressId` INTEGER NULL;

-- CreateTable
CREATE TABLE `address` (
    `addressId` INTEGER NOT NULL AUTO_INCREMENT,
    `line1` VARCHAR(191) NOT NULL,
    `line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`addressId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `employeeId` INTEGER NOT NULL AUTO_INCREMENT,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `storeNumber` INTEGER NOT NULL,
    `employmentStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `addressId` INTEGER NOT NULL,
    `hireDate` DATETIME(3) NOT NULL,
    `salary` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `roleId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_role` (
    `employeeId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,

    PRIMARY KEY (`employeeId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift` (
    `shiftId` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `startTimestamp` DATETIME(3) NOT NULL,
    `endTimestamp` DATETIME(3) NOT NULL,
    `clockInTimestamp` DATETIME(3) NULL,
    `clockOutTimestamp` DATETIME(3) NULL,

    PRIMARY KEY (`shiftId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `paymentId` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`paymentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card` (
    `cardId` INTEGER NOT NULL AUTO_INCREMENT,
    `cardholderName` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `lastFour` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `expirationMonth` INTEGER NOT NULL,
    `expirationYear` INTEGER NOT NULL,

    PRIMARY KEY (`cardId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `electronic_payment` (
    `cardId` INTEGER NOT NULL,
    `paymentId` INTEGER NOT NULL,

    PRIMARY KEY (`cardId`, `paymentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transaction` (
    `transactionId` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `quantityChange` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `packagePackageId` INTEGER NULL,

    PRIMARY KEY (`transactionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discount` (
    `discountId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`discountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_discount` (
    `discountId` INTEGER NOT NULL,
    `orderId` INTEGER NOT NULL,

    PRIMARY KEY (`discountId`, `orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `restaurant` ADD CONSTRAINT `restaurant_addressAddressId_fkey` FOREIGN KEY (`addressAddressId`) REFERENCES `address`(`addressId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_employeeEmployeeId_fkey` FOREIGN KEY (`employeeEmployeeId`) REFERENCES `employee`(`employeeId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_storeNumber_fkey` FOREIGN KEY (`storeNumber`) REFERENCES `restaurant`(`storeNumber`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `address`(`addressId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_role` ADD CONSTRAINT `employee_role_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`employeeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_role` ADD CONSTRAINT `employee_role_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`roleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift` ADD CONSTRAINT `shift_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`employeeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`orderId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `electronic_payment` ADD CONSTRAINT `electronic_payment_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `card`(`cardId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transaction` ADD CONSTRAINT `inventory_transaction_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`productId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transaction` ADD CONSTRAINT `inventory_transaction_packagePackageId_fkey` FOREIGN KEY (`packagePackageId`) REFERENCES `package`(`packageId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_discount` ADD CONSTRAINT `order_discount_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `discount`(`discountId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_discount` ADD CONSTRAINT `order_discount_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`orderId`) ON DELETE RESTRICT ON UPDATE CASCADE;
