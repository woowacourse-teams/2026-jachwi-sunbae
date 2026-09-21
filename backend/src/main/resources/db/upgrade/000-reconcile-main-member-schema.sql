SET @relax_member_oauth_provider = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'oauth_provider'),
    'ALTER TABLE members MODIFY COLUMN oauth_provider VARCHAR(20) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @relax_member_oauth_provider; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @relax_member_oauth_subject = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'oauth_subject'),
    'ALTER TABLE members MODIFY COLUMN oauth_subject VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL',
    'SELECT 1'
);
PREPARE stmt FROM @relax_member_oauth_subject; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @relax_member_display_name = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'display_name'),
    'ALTER TABLE members MODIFY COLUMN display_name VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @relax_member_display_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;
