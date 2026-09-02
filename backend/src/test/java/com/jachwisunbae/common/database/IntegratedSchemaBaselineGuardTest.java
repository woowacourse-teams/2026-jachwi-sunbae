package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.junit.jupiter.api.Test;

class IntegratedSchemaBaselineGuardTest {

    @Test
    void 미확인된_비어있지_않은_스키마는_기준선으로_등록하지_않는다() throws Exception {
        Connection connection = mock(Connection.class);
        Context context = mock(Context.class);
        when(context.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(anyString())).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0, String.class);
            PreparedStatement statement = mock(PreparedStatement.class);
            ResultSet resultSet = mock(ResultSet.class);
            boolean hasNonHistoryTable = sql.contains("table_name NOT IN");
            when(statement.executeQuery()).thenReturn(resultSet);
            when(resultSet.next()).thenReturn(true);
            when(resultSet.getBoolean(1)).thenReturn(hasNonHistoryTable);
            return statement;
        });

        assertThatThrownBy(() -> new IntegratedSchemaBaselineGuard().handle(Event.BEFORE_MIGRATE, context))
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining("unrecognized non-empty schema");
    }
}
