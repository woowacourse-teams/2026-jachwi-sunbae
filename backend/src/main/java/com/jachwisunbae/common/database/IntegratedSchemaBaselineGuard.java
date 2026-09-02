package com.jachwisunbae.common.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.springframework.stereotype.Component;

@Component
public final class IntegratedSchemaBaselineGuard implements Callback {

    private static final String HISTORY_TABLE = "integrated_schema_history";
    private static final String LEGACY_HISTORY_TABLE = "flyway_schema_history";
    private static final String HAS_TABLE_SQL = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_type = 'BASE TABLE'
                  AND table_name = ?
            )
            """;
    private static final String HAS_NON_HISTORY_TABLE_SQL = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_type = 'BASE TABLE'
                  AND table_name NOT IN (?, ?)
            )
            """;
    private static final String HAS_COLUMN_SQL = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
            )
            """;
    private static final String COLUMN_TYPE_SQL = """
            SELECT LOWER(column_type)
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = ?
              AND column_name = ?
            """;

    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.BEFORE_MIGRATE;
    }

    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return true;
    }

    @Override
    public void handle(Event event, Context context) {
        if (!supports(event, context)) {
            return;
        }
        try {
            Connection connection = context.getConnection();
            if (hasTable(connection, HISTORY_TABLE) || !hasNonHistoryTables(connection)) {
                return;
            }
            if (isRecognizedLegacySchema(connection)) {
                return;
            }
            throw new FlywayException(
                    "Refusing to baseline an unrecognized non-empty schema; verify the database before migration"
            );
        } catch (SQLException exception) {
            throw new FlywayException("Unable to inspect the schema before Flyway migration", exception);
        }
    }

    @Override
    public String getCallbackName() {
        return "integrated-schema-baseline-guard";
    }

    private boolean hasTable(Connection connection, String tableName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(HAS_TABLE_SQL)) {
            statement.setString(1, tableName);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getBoolean(1);
            }
        }
    }

    private boolean hasNonHistoryTables(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(HAS_NON_HISTORY_TABLE_SQL)) {
            statement.setString(1, HISTORY_TABLE);
            statement.setString(2, LEGACY_HISTORY_TABLE);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getBoolean(1);
            }
        }
    }

    private boolean isRecognizedLegacySchema(Connection connection) throws SQLException {
        return hasColumn(connection, "members", "id")
                && hasColumn(connection, "members", "email")
                && hasColumn(connection, "properties", "id")
                && hasColumn(connection, "properties", "member_id")
                && hasSupportedIdentifierTypes(connection)
                && hasTable(connection, "nickname_credentials")
                && hasTable(connection, "property_memos")
                && hasColumn(connection, "property_memos", "property_id")
                && hasTable(connection, "property_memo_items")
                && hasColumn(connection, "property_memo_items", "property_memo_id")
                && (hasColumn(connection, "property_memo_items", "system_memo_item_id")
                || hasColumn(connection, "property_memo_items", "system_meno_id"))
                && hasTable(connection, "system_memo_items");
    }

    private boolean hasSupportedIdentifierTypes(Connection connection) throws SQLException {
        String memberIdType = columnType(connection, "members", "id");
        String propertyIdType = columnType(connection, "properties", "id");
        String propertyMemberIdType = columnType(connection, "properties", "member_id");
        return ("bigint".equals(memberIdType) || "bigint unsigned".equals(memberIdType))
                && ("bigint".equals(propertyIdType) || "bigint unsigned".equals(propertyIdType))
                && memberIdType.equals(propertyMemberIdType);
    }

    private String columnType(Connection connection, String tableName, String columnName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(COLUMN_TYPE_SQL)) {
            statement.setString(1, tableName);
            statement.setString(2, columnName);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? resultSet.getString(1) : null;
            }
        }
    }

    private boolean hasColumn(Connection connection, String tableName, String columnName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(HAS_COLUMN_SQL)) {
            statement.setString(1, tableName);
            statement.setString(2, columnName);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getBoolean(1);
            }
        }
    }
}
