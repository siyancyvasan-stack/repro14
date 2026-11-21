-- Runtime application configuration. Values here survive frontend redeploys.
CREATE TABLE IF NOT EXISTS AppConfig (
    configKey VARCHAR(100) NOT NULL PRIMARY KEY,
    configValue VARCHAR(255) NOT NULL,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO AppConfig (configKey, configValue)
SELECT 'manager_app_version', '13.0.0'
WHERE NOT EXISTS (SELECT 1 FROM AppConfig WHERE configKey = 'manager_app_version');
