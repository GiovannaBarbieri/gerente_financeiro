-- CreateTable
CREATE TABLE "payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Other',
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "financial_transaction_tags" (
    "financial_transaction_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("financial_transaction_id", "tag_id"),
    CONSTRAINT "financial_transaction_tags_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "financial_transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financial_transaction_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'financial_entries',
    "filters" JSONB NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "recurring_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "next_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "category" TEXT,
    "subcategory" TEXT,
    "account_name" TEXT,
    "card_name" TEXT,
    "payment_method_id" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recurring_entries_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_entry_audits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "financial_transaction_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_entry_audits_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bank" TEXT,
    "type" TEXT NOT NULL,
    "initial_balance" DECIMAL NOT NULL DEFAULT 0,
    "current_balance" DECIMAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "default_account" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_accounts" ("bank", "created_at", "id", "name", "type") SELECT "bank", "created_at", "id", "name", "type" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE TABLE "new_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bank" TEXT,
    "brand" TEXT,
    "color" TEXT,
    "closing_day" INTEGER,
    "due_day" INTEGER,
    "limit_amount" DECIMAL,
    "available_limit" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "payment_account_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cards_payment_account_id_fkey" FOREIGN KEY ("payment_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cards" ("bank", "closing_day", "created_at", "due_day", "id", "limit_amount", "name") SELECT "bank", "closing_day", "created_at", "due_day", "id", "limit_amount", "name" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
CREATE TABLE "new_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'expense',
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_categories" ("created_at", "id", "name", "type") SELECT "created_at", "id", "name", "type" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE TABLE "new_financial_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER,
    "external_id" TEXT,
    "raw_record_id" TEXT,
    "import_file_id" TEXT,
    "import_batch_group_id" TEXT,
    "invoice_id" TEXT,
    "transaction_date" DATETIME NOT NULL,
    "competence" TEXT NOT NULL,
    "invoice_competence" TEXT,
    "payment_date" DATETIME,
    "payment_competence" TEXT,
    "due_date" DATETIME,
    "source_type" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "financial_nature" TEXT NOT NULL,
    "original_description" TEXT NOT NULL,
    "normalized_description" TEXT NOT NULL,
    "person_company" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_method_id" INTEGER,
    "entry_kind" TEXT,
    "status" TEXT DEFAULT 'pending',
    "card_name" TEXT,
    "installment" INTEGER,
    "total_installments" INTEGER,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "transfer_internal" BOOLEAN NOT NULL DEFAULT false,
    "cash_flow_impact" BOOLEAN NOT NULL DEFAULT true,
    "real_consumption_impact" BOOLEAN NOT NULL DEFAULT true,
    "classification_confidence" INTEGER NOT NULL DEFAULT 50,
    "classification_source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "review_status" TEXT NOT NULL DEFAULT 'Pending',
    "import_batch" TEXT NOT NULL,
    "import_batch_id" INTEGER,
    "notes" TEXT,
    "hash" TEXT NOT NULL,
    "strict_hash" TEXT,
    "soft_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "financial_transactions_raw_record_id_fkey" FOREIGN KEY ("raw_record_id") REFERENCES "raw_import_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_import_file_id_fkey" FOREIGN KEY ("import_file_id") REFERENCES "import_files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_import_batch_group_id_fkey" FOREIGN KEY ("import_batch_group_id") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "credit_card_invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_financial_transactions" ("account_name", "amount", "card_name", "cash_flow_impact", "category", "classification_confidence", "classification_source", "competence", "created_at", "external_id", "financial_nature", "hash", "id", "import_batch", "import_batch_group_id", "import_batch_id", "import_file_id", "installment", "institution", "invoice_competence", "invoice_id", "normalized_description", "notes", "origin", "original_description", "payment_competence", "payment_date", "payment_method", "person_company", "raw_record_id", "real_consumption_impact", "reconciled", "review_status", "soft_hash", "source_type", "strict_hash", "subcategory", "total_installments", "transaction_date", "transaction_type", "transfer_internal", "updated_at", "user_id") SELECT "account_name", "amount", "card_name", "cash_flow_impact", "category", "classification_confidence", "classification_source", "competence", "created_at", "external_id", "financial_nature", "hash", "id", "import_batch", "import_batch_group_id", "import_batch_id", "import_file_id", "installment", "institution", "invoice_competence", "invoice_id", "normalized_description", "notes", "origin", "original_description", "payment_competence", "payment_date", "payment_method", "person_company", "raw_record_id", "real_consumption_impact", "reconciled", "review_status", "soft_hash", "source_type", "strict_hash", "subcategory", "total_installments", "transaction_date", "transaction_type", "transfer_internal", "updated_at", "user_id" FROM "financial_transactions";
DROP TABLE "financial_transactions";
ALTER TABLE "new_financial_transactions" RENAME TO "financial_transactions";
CREATE UNIQUE INDEX "financial_transactions_hash_key" ON "financial_transactions"("hash");
CREATE UNIQUE INDEX "financial_transactions_strict_hash_key" ON "financial_transactions"("strict_hash");
CREATE INDEX "financial_transactions_transaction_date_idx" ON "financial_transactions"("transaction_date");
CREATE INDEX "financial_transactions_competence_idx" ON "financial_transactions"("competence");
CREATE INDEX "financial_transactions_invoice_competence_idx" ON "financial_transactions"("invoice_competence");
CREATE INDEX "financial_transactions_payment_competence_idx" ON "financial_transactions"("payment_competence");
CREATE INDEX "financial_transactions_source_type_idx" ON "financial_transactions"("source_type");
CREATE INDEX "financial_transactions_financial_nature_idx" ON "financial_transactions"("financial_nature");
CREATE INDEX "financial_transactions_origin_idx" ON "financial_transactions"("origin");
CREATE INDEX "financial_transactions_category_idx" ON "financial_transactions"("category");
CREATE INDEX "financial_transactions_import_batch_idx" ON "financial_transactions"("import_batch");
CREATE INDEX "financial_transactions_import_batch_id_idx" ON "financial_transactions"("import_batch_id");
CREATE INDEX "financial_transactions_import_file_id_idx" ON "financial_transactions"("import_file_id");
CREATE INDEX "financial_transactions_import_batch_group_id_idx" ON "financial_transactions"("import_batch_group_id");
CREATE INDEX "financial_transactions_raw_record_id_idx" ON "financial_transactions"("raw_record_id");
CREATE INDEX "financial_transactions_soft_hash_idx" ON "financial_transactions"("soft_hash");
CREATE INDEX "financial_transactions_payment_method_id_idx" ON "financial_transactions"("payment_method_id");
CREATE INDEX "financial_transactions_status_idx" ON "financial_transactions"("status");
CREATE INDEX "financial_transactions_due_date_idx" ON "financial_transactions"("due_date");
CREATE TABLE "new_subcategories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_subcategories" ("category_id", "created_at", "id", "name") SELECT "category_id", "created_at", "id", "name" FROM "subcategories";
DROP TABLE "subcategories";
ALTER TABLE "new_subcategories" RENAME TO "subcategories";
CREATE UNIQUE INDEX "subcategories_category_id_name_key" ON "subcategories"("category_id", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "attachments_financial_transaction_id_idx" ON "attachments"("financial_transaction_id");

-- CreateIndex
CREATE INDEX "recurring_entries_status_idx" ON "recurring_entries"("status");

-- CreateIndex
CREATE INDEX "recurring_entries_next_date_idx" ON "recurring_entries"("next_date");

-- CreateIndex
CREATE INDEX "financial_entry_audits_financial_transaction_id_idx" ON "financial_entry_audits"("financial_transaction_id");

