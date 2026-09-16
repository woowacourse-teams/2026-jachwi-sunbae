package com.jachwisunbae.member.repository;

import com.jachwisunbae.member.entity.Member;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Locale;
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
    public Optional<Member> findByNickname(final String nickname) {
        String sql = """
                SELECT id, nickname, password_hash, created_at, updated_at
                FROM members
                WHERE nickname_key = ?
                """;
        return jdbcTemplate.query(sql, memberRowMapper(), nicknameKey(nickname)).stream().findFirst();
    }

    @Override
    public Member save(final Member member) {
        String sql = """
                INSERT INTO members (nickname, nickname_key, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, member.getNickname());
            statement.setString(2, nicknameKey(member.getNickname()));
            statement.setString(3, member.getPasswordHash());
            statement.setObject(4, member.getCreatedAt());
            statement.setObject(5, member.getUpdatedAt());
            return statement;
        }, keyHolder);
        long memberId = keyHolder.getKey().longValue();
        upsertLegacyCredential(memberId, member);
        return Member.reconstruct(memberId, member.getNickname(), member.getPasswordHash(),
                member.getCreatedAt(), member.getUpdatedAt());
    }

    @Override
    public void update(final Member member) {
        String sql = """
                UPDATE members
                SET nickname = ?, nickname_key = ?, password_hash = ?, updated_at = ?
                WHERE id = ?
                """;
        jdbcTemplate.update(sql, member.getNickname(), nicknameKey(member.getNickname()), member.getPasswordHash(),
                member.getUpdatedAt(), member.getId());
        upsertLegacyCredential(member.getId(), member);
    }

    private void upsertLegacyCredential(final long memberId, final Member member) {
        String sql = """
                INSERT INTO nickname_credentials
                    (member_id, nickname, nickname_key, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    nickname = VALUES(nickname),
                    nickname_key = VALUES(nickname_key),
                    password_hash = VALUES(password_hash),
                    updated_at = VALUES(updated_at)
                """;
        jdbcTemplate.update(sql, memberId, member.getNickname(), nicknameKey(member.getNickname()),
                member.getPasswordHash(), member.getCreatedAt(), member.getUpdatedAt());
    }

    private String nicknameKey(final String nickname) {
        return nickname.toLowerCase(Locale.ROOT);
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
