-- Backfill password auth for seed/demo accounts created before `passwordHash`
-- existed (previously NULL, so password sign-in always fell through to the
-- email-code path). Non-breaking: only NULL hashes on the known seed user
-- ids are filled — real user passwords are never touched.
-- Hash of the documented demo password `Homewolves123!`
-- (format: scrypt:<salt-hex>:<hash-hex>, see SEED_USER_PASSWORD_HASH).
UPDATE "User" SET "passwordHash" = 'scrypt:b84dc5f8db52434d630dfe55fb013e51:2dab385a2f25af6bd2dfae799c51ee5e6adb6afbc25d551357c53e864b15543a7c3e52b0419ddd2ec6dd744a305d2dba54bd538aad43d43743a8479985f86d81' WHERE id IN ('seed-user-admin-0001', 'seed-user-agent-0001', 'seed-user-agent-0002', 'seed-user-buyer-0001', 'seed-user-buyer-0002') AND "passwordHash" IS NULL;
