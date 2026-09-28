package com.jachwisunbae.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.auth.controller.dto.LoginResponse;
import com.jachwisunbae.auth.controller.dto.NicknameLoginRequest;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.entity.Member;
import com.jachwisunbae.member.repository.MemberRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private static final String SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final long ACCESS_TOKEN_SECONDS = 43_200;

    private final Clock clock = Clock.fixed(Instant.parse("2026-09-28T00:00:00Z"), ZoneOffset.UTC);
    private final InMemoryMemberRepository memberRepository = new InMemoryMemberRepository();
    // 테스트 속도를 위해 BCrypt 비용을 최소값으로 둔다.
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final JwtTokenProvider tokenProvider = new JwtTokenProvider(SECRET, "jachwi-sunbae",
            "jachwi-sunbae-api", ACCESS_TOKEN_SECONDS, clock);
    private final AuthService authService = new AuthService(memberRepository, passwordEncoder, tokenProvider,
            clock, ACCESS_TOKEN_SECONDS);

    @Test
    @DisplayName("처음 보는 닉네임이면 비밀번호 없는 회원을 만든다")
    void createsSharedMemberForNewNickname() {
        LoginResponse response = login("자취초보", null);

        assertThat(response.newMember()).isTrue();
        assertThat(response.member().name()).isEqualTo("자취초보");
        assertThat(response.member().passwordProtected()).isFalse();
        assertThat(memberRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("비밀번호 없는 닉네임으로 다시 시작하면 같은 회원으로 로그인한다")
    void logsInSameSharedMember() {
        LoginResponse first = login("자취초보", null);
        LoginResponse second = login("자취초보", null);

        assertThat(second.newMember()).isFalse();
        assertThat(second.member().memberId()).isEqualTo(first.member().memberId());
        assertThat(memberRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("닉네임의 앞뒤 공백은 제거하고 저장한다")
    void trimsNickname() {
        LoginResponse response = login("  자취초보  ", null);

        assertThat(response.member().name()).isEqualTo("자취초보");
    }

    @Test
    @DisplayName("비밀번호와 함께 시작하면 비밀번호를 해시로 저장한 보호 회원을 만든다")
    void createsProtectedMemberWithPasswordHash() {
        LoginResponse response = login("보호닉네임", "1234");

        Member member = memberRepository.findById(response.member().memberId()).orElseThrow();
        assertThat(response.member().passwordProtected()).isTrue();
        assertThat(member.getPasswordHash()).isNotEqualTo("1234");
        assertThat(passwordEncoder.matches("1234", member.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("보호 회원은 올바른 비밀번호로 로그인한다")
    void logsInProtectedMemberWithCorrectPassword() {
        LoginResponse first = login("보호닉네임", "1234");
        LoginResponse second = login("보호닉네임", "1234");

        assertThat(second.newMember()).isFalse();
        assertThat(second.member().memberId()).isEqualTo(first.member().memberId());
    }

    @Test
    @DisplayName("보호 회원에 틀린 비밀번호를 입력하면 실패하고 회원을 만들지 않는다")
    void rejectsWrongPasswordWithoutCreatingMember() {
        login("보호닉네임", "1234");

        assertThatThrownBy(() -> login("보호닉네임", "9999"))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_AUTHENTICATION_FAILED));
        assertThat(memberRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("로그인한 회원의 Bearer Access Token을 발급한다")
    void issuesBearerAccessToken() {
        LoginResponse response = login("자취초보", null);

        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(ACCESS_TOKEN_SECONDS);
        assertThat(tokenProvider.parseMemberId(response.accessToken())).isEqualTo(response.member().memberId());
    }

    private LoginResponse login(String nickname, String password) {
        return authService.loginNickname(new NicknameLoginRequest(nickname, password));
    }

    private static class InMemoryMemberRepository implements MemberRepository {

        private final Map<Long, Member> members = new LinkedHashMap<>();
        private long sequence;

        int count() {
            return members.size();
        }

        @Override
        public Optional<Member> findById(Long memberId) {
            return Optional.ofNullable(members.get(memberId));
        }

        @Override
        public Optional<Member> findByIdForUpdate(Long memberId) {
            return findById(memberId);
        }

        @Override
        public Optional<Member> findByNickname(String nickname) {
            return members.values().stream()
                    .filter(member -> member.getNickname().equals(nickname))
                    .findFirst();
        }

        @Override
        public Member save(Member member) {
            Member saved = Member.reconstruct(++sequence, member.getNickname(), member.getPasswordHash(),
                    member.getCreatedAt(), member.getUpdatedAt());
            members.put(saved.getId(), saved);
            return saved;
        }

        @Override
        public void update(Member member) {
            members.put(member.getId(), member);
        }
    }
}
