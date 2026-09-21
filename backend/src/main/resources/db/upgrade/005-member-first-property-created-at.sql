-- 광고 전환을 한 회원당 한 번만 식별하도록 최초 매물 등록 시각을 보존한다.

SET @add_first_property_created_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'members'
              AND column_name = 'first_property_created_at'
        ),
        'SELECT 1',
        'ALTER TABLE members ADD COLUMN first_property_created_at DATETIME(6) NULL AFTER last_login_at'
    )
);
PREPARE add_first_property_created_at_statement FROM @add_first_property_created_at;
EXECUTE add_first_property_created_at_statement;
DEALLOCATE PREPARE add_first_property_created_at_statement;

UPDATE members AS member
JOIN (
    SELECT member_id, MIN(created_at) AS first_property_created_at
    FROM properties
    GROUP BY member_id
) AS first_property ON first_property.member_id = member.id
SET member.first_property_created_at = first_property.first_property_created_at
WHERE member.first_property_created_at IS NULL;
