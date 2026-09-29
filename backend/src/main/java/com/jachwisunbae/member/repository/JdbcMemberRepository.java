package com.jachwisunbae.member.repository;

import com.jachwisunbae.member.entity.Member;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcMemberRepository implements MemberRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcMemberRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Member> findById(final Long memberId) {
        String sql = """
                SELECT id, nickname, password_hash, created_at, updated_at
                FROM members
                WHERE id = ?
                """;
        return jdbcTemplate.query(sql, memberRowMapper(), memberId).stream().findFirst();
    }

    @Override
    public Optional<Member> findByIdForUpdate(final Long memberId) {
        String sql = """
                SELECT id, nickname, password_hash, created_at, updated_at
                FROM members
                WHERE id = ?
                FOR UPDATE
                """;
        return jdbcTemplate.query(sql, memberRowMapper(), memberId).stream().findFirst();
    }

    @Override
    public Optional<Member> findByNicknameAndPasswordProtected(final String nickname,
                                                              final boolean passwordProtected) {
        String sql = """
                SELECT id, nickname, password_hash, created_at, updated_at
                FROM members
                WHERE nickname = ? AND password_protected = ?
                """;
        return jdbcTemplate.query(sql, memberRowMapper(), nickname, passwordProtected).stream().findFirst();
    }

    @Override
    public Member save(final Member member) {
        String sql = """
                INSERT INTO members (nickname, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, member.getNickname());
            statement.setString(2, member.getPasswordHash());
            statement.setObject(3, member.getCreatedAt());
            statement.setObject(4, member.getUpdatedAt());
            return statement;
        }, keyHolder);
        long memberId = keyHolder.getKey().longValue();
        return Member.reconstruct(memberId, member.getNickname(), member.getPasswordHash(),
                member.getCreatedAt(), member.getUpdatedAt());
    }

    private RowMapper<Member> memberRowMapper() {
        return (resultSet, rowNumber) -> Member.reconstruct(
                resultSet.getLong("id"),
                resultSet.getString("nickname"),
                resultSet.getString("password_hash"),
                resultSet.getTimestamp("created_at").toLocalDateTime(),
                resultSet.getTimestamp("updated_at").toLocalDateTime()
        );
    }
}
