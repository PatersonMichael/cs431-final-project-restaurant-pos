# Restaurant Database — Data Dictionary

## Table of Contents
- [Location](#location)
  - [RESTAURANT](#restaurant)
  - [ADDRESS](#address)
- [Staff](#staff)
  - [EMPLOYEE](#employee)
  - [ROLE](#role)
  - [EMPLOYEE_ROLE](#employee_role)
  - [SHIFT](#shift)
- [Menu](#menu)
  - [ORDERABLE_ITEM](#orderable_item)
  - [PRODUCT](#product)
  - [PRODUCT_TYPE](#product_type)
  - [PACKAGE](#package)
  - [PACKAGE_PRODUCT](#package_product)
- [Orders](#orders)
  - [ORDER](#order)
  - [ORDER_ITEM](#order_item)
  - [DISCOUNT](#discount)
  - [ORDER_DISCOUNT](#order_discount)
- [Payments](#payments)
  - [PAYMENT](#payment)
  - [ELECTRONIC_PAYMENT](#electronic_payment)
  - [CARD](#card)
- [Inventory](#inventory)
  - [INVENTORY_TRANSACTION](#inventory_transaction)

---

## Location

### RESTAURANT
Physical store locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `store_number` | INT | PK | Unique identifier for each restaurant location |
| `phone_number` | VARCHAR | NN | Contact phone number for the location |
| `name` | VARCHAR | NN | Name of the restaurant location |
| `address_id` | INT | FK | References ADDRESS — physical location of the restaurant |

### ADDRESS
Postal addresses shared across entities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `address_id` | INT | PK | Unique address identifier |
| `line_1` | VARCHAR | NN | Primary street address |
| `line_2` | VARCHAR | | Apartment, suite, or unit number (optional) |
| `city` | VARCHAR | NN | City name |
| `state` | VARCHAR | NN | State or province |
| `country` | VARCHAR | NN | Country |
| `postal_code` | VARCHAR | NN | ZIP or postal code |

---

## Staff

### EMPLOYEE
Staff members at each restaurant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `employee_id` | INT | PK | Unique employee identifier |
| `date_of_birth` | DATE | NN | Employee date of birth |
| `store_number` | INT | FK, NN | References RESTAURANT — the location this employee works at |
| `employment_status` | VARCHAR | NN | Current status (e.g., active, terminated) |
| `first_name` | VARCHAR | NN | Employee first name |
| `last_name` | VARCHAR | NN | Employee last name |
| `address_id` | INT | FK | References ADDRESS — employee home address |
| `hire_date` | DATE | NN | Date the employee was hired |
| `salary` | DECIMAL | | Base salary (if salaried; null for hourly) |

### ROLE
Job roles available in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `role_id` | INT | PK | Unique role identifier |
| `name` | VARCHAR | NN, UQ | Role name (e.g., cashier, manager, cook) |
| `description` | TEXT | | Description of responsibilities for this role |

### EMPLOYEE_ROLE
Many-to-many assignment of roles to employees.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `employee_id` | INT | PK, FK | References EMPLOYEE |
| `role_id` | INT | PK, FK | References ROLE |

### SHIFT
Scheduled and actual shift records per employee.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `shift_id` | INT | PK | Unique shift identifier |
| `employee_id` | INT | FK, NN | References EMPLOYEE — who worked this shift |
| `role_id` | INT | FK, NN | References ROLE — role performed during this shift |
| `start_timestamp` | TIMESTAMP | NN | Scheduled shift start time |
| `end_timestamp` | TIMESTAMP | NN | Scheduled shift end time |
| `clock_in_timestamp` | TIMESTAMP | | Actual clock-in time (null if not yet clocked in) |
| `clock_out_timestamp` | TIMESTAMP | | Actual clock-out time (null if still on shift) |

---

## Menu

### ORDERABLE_ITEM
Top-level menu items that can be added to an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `item_id` | INT | PK | Unique item identifier |
| `item_type` | VARCHAR | NN | Discriminator — 'product' or 'package' |
| `is_available` | BOOLEAN | NN | Whether the item is currently available for ordering |

### PRODUCT
Individual products (food or drink items).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `product_id` | INT | PK, FK | References ORDERABLE_ITEM — inherits item identity |
| `name` | VARCHAR | NN | Product display name |
| `type` | INT | FK, NN | References PRODUCT_TYPE — category of product |
| `base_price` | DECIMAL | NN | Standard price before any discounts |

### PRODUCT_TYPE
Categories of products (e.g., burger, drink, side).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `type_id` | INT | PK | Unique product type identifier |
| `name` | VARCHAR | NN, UQ | Type name (e.g., Sandwich, Beverage) |
| `description` | TEXT | | Description of what products belong to this type |

### PACKAGE
Bundled sets of products sold at a combined price.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `package_id` | INT | PK, FK | References ORDERABLE_ITEM — inherits item identity |
| `name` | VARCHAR | NN | Package display name (e.g., Combo #3) |
| `bundle_price` | DECIMAL | NN | Price for the full bundle |

### PACKAGE_PRODUCT
Junction table — which products belong to which packages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `product_id` | INT | PK, FK | References PRODUCT |
| `package_id` | INT | PK, FK | References PACKAGE |

---

## Orders

### ORDER
Customer orders placed at a restaurant location.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `order_id` | INT | PK | Unique order identifier |
| `customer_name` | VARCHAR | | Name provided by the customer (optional) |
| `timestamp` | TIMESTAMP | NN | Date and time the order was placed |
| `preparation_status` | VARCHAR | NN | Current status (e.g., pending, preparing, ready, completed) |
| `store_number` | INT | FK, NN | References RESTAURANT — where the order was placed |
| `total` | DECIMAL | NN | Final total after discounts and tax |
| `subtotal` | DECIMAL | NN | Sum of item prices before tax and discounts |
| `tip` | DECIMAL | | Tip amount added by the customer |
| `tax_percent` | DECIMAL | NN | Tax rate applied to this order |
| `employee_id` | INT | FK | References EMPLOYEE — who took the order |

### ORDER_ITEM
Individual line items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `order_item_id` | INT | PK | Unique line-item identifier |
| `order_id` | INT | FK, NN | References ORDER — the parent order |
| `item_id` | INT | FK, NN | References ORDERABLE_ITEM — the product or package ordered |
| `quantity` | INT | NN | Number of this item ordered |
| `price_at_purchase` | DECIMAL | NN | Price locked in at time of order (handles price changes) |

### DISCOUNT
Available discount definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `discount_id` | INT | PK | Unique discount identifier |
| `name` | VARCHAR | NN | Discount name (e.g., Employee Discount, Happy Hour) |
| `value` | DECIMAL | NN | Discount amount or percentage value |
| `type` | VARCHAR | NN | Whether value is a flat amount or a percentage |

### ORDER_DISCOUNT
Discounts applied to specific orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `discount_id` | INT | PK, FK | References DISCOUNT |
| `order_id` | INT | PK, FK | References ORDER |

---

## Payments

### PAYMENT
Payment records linked to orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_id` | INT | PK | Unique payment identifier |
| `type` | VARCHAR | NN | Payment method type (cash, electronic, etc.) |
| `amount` | DECIMAL | NN | Amount paid in this payment record |
| `order_id` | INT | FK, NN | References ORDER — the order this payment covers |

### ELECTRONIC_PAYMENT
Electronic payment details linked to a card.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_id` | INT | PK, FK | References CARD — the card used |
| `payment_id` | INT | PK, FK | References PAYMENT — the base payment record |

### CARD
Stored card information for electronic payments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_id` | INT | PK | Unique card identifier |
| `cardholder_name` | VARCHAR | NN | Name of the cardholder as printed on card |
| `token` | VARCHAR | NN, UQ | Tokenized card reference (replaces raw PAN for PCI compliance) |
| `last_four` | CHAR(4) | NN | Last four digits of the card number for display |
| `brand` | VARCHAR | NN | Card brand (e.g., Visa, Mastercard, Amex) |
| `expiration_month` | INT | NN | Card expiration month (1–12) |
| `expiration_year` | INT | NN | Card expiration year (4-digit) |

---

## Inventory

### INVENTORY_TRANSACTION
Audit log of inventory changes per product.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `transaction_id` | INT | PK | Unique transaction identifier |
| `product_id` | INT | FK, NN | References PRODUCT — which product was affected |
| `quantity_change` | INT | NN | Signed change in quantity (positive = restock, negative = usage) |
| `reason` | VARCHAR | NN | Reason for the change (e.g., sale, restock, waste, adjustment) |
| `timestamp` | TIMESTAMP | NN | When the inventory change occurred |

---

*Constraints key: PK = Primary Key, FK = Foreign Key, NN = Not Null, UQ = Unique*
