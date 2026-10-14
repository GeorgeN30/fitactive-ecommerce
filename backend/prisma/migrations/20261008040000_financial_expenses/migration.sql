CREATE TABLE "financial_expenses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "category" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255) NOT NULL, "amount" DECIMAL(10,2) NOT NULL CHECK ("amount" > 0),
  "spent_at" TIMESTAMPTZ NOT NULL, "created_by" UUID NOT NULL REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "financial_expenses_spent_at_idx" ON "financial_expenses"("spent_at");
CREATE INDEX "financial_expenses_category_spent_at_idx" ON "financial_expenses"("category", "spent_at");
