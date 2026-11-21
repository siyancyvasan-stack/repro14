-- Creates the dedicated Factory Portal login in the existing User table.
-- Do not create a separate factory user table: authentication and tenant
-- isolation are already handled by User.role and User.tenantId.

START TRANSACTION;

INSERT INTO User (
  id, email, passwordHash, name, role, tenantId, status, createdAt, updatedAt
)
SELECT
  'u_factory_manager',
  'factory@reproutes.com',
  '$2b$12$qRLwuA5MVwEerD65HcVUhO/mKkGT1EUp1kLGVgFIcWTgsbG.9AUJm',
  'Reproutes Factory Manager',
  'FACTORY_MANAGER',
  t.id,
  'ACTIVE',
  NOW(),
  NOW()
FROM Tenant t
WHERE t.slug = 'reproutes'
  AND NOT EXISTS (
    SELECT 1 FROM User u WHERE u.email = 'factory@reproutes.com'
  );

UPDATE User u
JOIN Tenant t ON t.id = u.tenantId
SET
  u.passwordHash = '$2b$12$qRLwuA5MVwEerD65HcVUhO/mKkGT1EUp1kLGVgFIcWTgsbG.9AUJm',
  u.name = 'Reproutes Factory Manager',
  u.role = 'FACTORY_MANAGER',
  u.status = 'ACTIVE',
  u.updatedAt = NOW()
WHERE u.email = 'factory@reproutes.com'
  AND t.slug = 'reproutes';

COMMIT;
