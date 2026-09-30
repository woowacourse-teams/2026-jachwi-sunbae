package com.jachwisunbae.member.repository;

import com.jachwisunbae.common.exception.client.ClientException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.DataInconsistencyException;
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

    // DB에 저장된 값이 회원 규칙(닉네임 길이 등)을 만족하지 않는 것은 사용자 요청이 아니라 서버 데이터 문제다.
    // 회원 규칙은 사용자 입력 기준이라 ClientException(400)을 던지므로, 복원할 때는 500으로 바꾼다.
    private RowMapper<Member> memberRowMapper() {
        return (resultSet, rowNumber) -> {
            long memberId = resultSet.getLong("id");
            try {
                return Member.reconstruct(
                        memberId,
                        resultSet.getString("nickname"),
                        resultSet.getString("password_hash"),
                        resultSet.getTimestamp("created_at").toLocalDateTime(),
                        resultSet.getTimestamp("updated_at").toLocalDateTime()
                );
            } catch (ClientException exception) {
                throw new DataInconsistencyException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "memberId=" + memberId + " 저장된 회원 데이터가 회원 규칙을 만족하지 않습니다.", exception);
            }
        };
    }
}
