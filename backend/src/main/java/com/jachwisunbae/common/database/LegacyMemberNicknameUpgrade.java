package com.jachwisunbae.common.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

final class LegacyMemberNicknameUpgrade {

    private static final String UPGRADE_NAME = "000-normalize-main-member-nicknames.java";
    private static final int MAX_NICKNAME_LENGTH = 30;

    private LegacyMemberNicknameUpgrade() {
    }

    static void apply(final Connection connection) throws SQLException {
        if (isApplied(connection)) {
            return;
        }
        boolean previousAutoCommit = connection.getAutoCommit();
        connection.setAutoCommit(false);
        try {
            List<LegacyMember> legacyMembers = findLegacyMembers(connection);
            reserveTemporaryNicknames(connection, legacyMembers);
            Set<String> occupiedKeys = findOccupiedNicknameKeys(connection);
            for (LegacyMember legacyMember : legacyMembers) {
                AllocatedNickname nickname = allocateNickname(legacyMember, occupiedKeys);
                updateMemberNickname(connection, legacyMember.id(), nickname);
                updateLegacyCredential(connection, legacyMember.id(), nickname);
            }
            recordApplied(connection);
            connection.commit();
        } catch (SQLException | RuntimeException exception) {
            connection.rollback();
            throw exception;
        } finally {
            connection.setAutoCommit(previousAutoCommit);
        }
    }

    private static List<LegacyMember> findLegacyMembers(final Connection connection) throws SQLException {
        if (!hasColumn(connection, "members", "oauth_provider")
                || !hasColumn(connection, "members", "display_name")) {
            return List.of();
        }
        List<LegacyMember> members = new ArrayList<>();
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT id, display_name
                FROM members
                WHERE oauth_provider IS NOT NULL
                  AND password_hash IS NULL
                ORDER BY id
                """); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                members.add(new LegacyMember(resultSet.getLong("id"), resultSet.getString("display_name")));
            }
        }
        return members;
    }

    private static boolean hasColumn(final Connection connection, final String tableName, final String columnName)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
                """)) {
            statement.setString(1, tableName);
            statement.setString(2, columnName);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt(1) > 0;
            }
        }
    }

    private static void reserveTemporaryNicknames(final Connection connection, final List<LegacyMember> members)
            throws SQLException {
        try (PreparedStatement memberStatement = connection.prepareStatement("""
                UPDATE members
                SET nickname = ?, nickname_key = ?
                WHERE id = ?
                """); PreparedStatement credentialStatement = connection.prepareStatement("""
                UPDATE nickname_credentials
                SET nickname = ?, nickname_key = ?
                WHERE member_id = ?
                """)) {
            for (LegacyMember member : members) {
                String temporaryNickname = createTemporaryNickname(connection);
                updateNickname(memberStatement, member.id(), temporaryNickname, temporaryNickname);
                updateNickname(credentialStatement, member.id(), temporaryNickname, temporaryNickname);
            }
        }
    }

    private static String createTemporaryNickname(final Connection connection) throws SQLException {
        while (true) {
            String candidate = "~migration-" + UUID.randomUUID();
            if (isTemporaryNicknameAvailable(connection, candidate)) {
                return candidate;
            }
        }
    }

    private static boolean isTemporaryNicknameAvailable(final Connection connection, final String candidate)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT NOT EXISTS (
                    SELECT 1 FROM members WHERE nickname = ? OR nickname_key = ?
                    UNION ALL
                    SELECT 1 FROM nickname_credentials WHERE nickname = ? OR nickname_key = ?
                )
                """)) {
            statement.setString(1, candidate);
            statement.setString(2, candidate);
            statement.setString(3, candidate);
            statement.setString(4, candidate);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getBoolean(1);
            }
        }
    }

    private static Set<String> findOccupiedNicknameKeys(final Connection connection) throws SQLException {
        Set<String> occupiedKeys = new HashSet<>();
        try (PreparedStatement statement = connection.prepareStatement("SELECT nickname_key FROM members");
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                occupiedKeys.add(resultSet.getString("nickname_key"));
            }
        }
        return occupiedKeys;
    }

    private static AllocatedNickname allocateNickname(final LegacyMember member, final Set<String> occupiedKeys) {
        String base = normalizeLegacyName(member.displayName());
        for (int attempt = 0; ; attempt++) {
            String suffix = attempt == 0 ? "" : createSuffix(member.id(), attempt);
            String displayName = truncate(base, MAX_NICKNAME_LENGTH - suffix.codePointCount(0, suffix.length()))
                    + suffix;
            String key = displayName.toLowerCase(Locale.ROOT);
            if (occupiedKeys.add(key)) {
                return new AllocatedNickname(displayName, key);
            }
        }
    }

    private static String normalizeLegacyName(final String rawName) {
        String normalized = Normalizer.normalize(rawName == null ? "" : rawName, Normalizer.Form.NFKC);
        StringBuilder sanitized = new StringBuilder();
        normalized.codePoints()
                .filter(codePoint -> !Character.isISOControl(codePoint))
                .forEach(sanitized::appendCodePoint);
        String trimmed = sanitized.toString().trim();
        return truncate(trimmed.isEmpty() ? "기존 사용자" : trimmed, MAX_NICKNAME_LENGTH);
    }

    private static String createSuffix(final long memberId, final int attempt) {
        if (attempt == 1) {
            return " #" + memberId;
        }
        return " #" + memberId + "-" + attempt;
    }

    private static String truncate(final String value, final int maxCodePoints) {
        if (value.codePointCount(0, value.length()) <= maxCodePoints) {
            return value;
        }
        return value.substring(0, value.offsetByCodePoints(0, maxCodePoints));
    }

    private static void updateMemberNickname(final Connection connection, final long memberId,
                                             final AllocatedNickname nickname) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE members
                SET nickname = ?, nickname_key = ?
                WHERE id = ?
                """)) {
            statement.setString(1, nickname.displayName());
            statement.setString(2, nickname.key());
            statement.setLong(3, memberId);
            statement.executeUpdate();
        }
    }

    private static void updateLegacyCredential(final Connection connection, final long memberId,
                                               final AllocatedNickname nickname) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                UPDATE nickname_credentials
                SET nickname = ?, nickname_key = ?
                WHERE member_id = ?
                """)) {
            statement.setString(1, nickname.displayName());
            statement.setString(2, nickname.key());
            statement.setLong(3, memberId);
            statement.executeUpdate();
        }
    }

    private static void updateNickname(final PreparedStatement statement, final long memberId,
                                       final String nickname, final String nicknameKey) throws SQLException {
        statement.setString(1, nickname);
        statement.setString(2, nicknameKey);
        statement.setLong(3, memberId);
        statement.executeUpdate();
    }

    private static boolean isApplied(final Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM schema_upgrade_history WHERE script_name = ?")) {
            statement.setString(1, UPGRADE_NAME);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt(1) > 0;
            }
        }
    }

    private static void recordApplied(final Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO schema_upgrade_history (script_name) VALUES (?)")) {
            statement.setString(1, UPGRADE_NAME);
            statement.executeUpdate();
        }
    }

    private record LegacyMember(long id, String displayName) {
    }

    private record AllocatedNickname(String displayName, String key) {
    }
}
