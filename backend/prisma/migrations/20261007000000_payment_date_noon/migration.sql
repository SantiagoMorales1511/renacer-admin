UPDATE "Payment"
SET "paidAt" = "paidAt" + interval '12 hours'
WHERE "paidAt" = (date_trunc('day', "paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
