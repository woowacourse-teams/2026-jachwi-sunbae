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
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder.SecretKeyFactoryAlgorithm;

class AuthServiceTest {

    private static final String SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final long ACCESS_TOKEN_SECONDS = 43_200;

    private final Clock clock = Clock.fixed(Instant.parse("2026-09-28T00:00:00Z"), ZoneOffset.UTC);
    private final InMemoryMemberRepository memberRepository = new InMemoryMemberRepository();
    // 운영과 같은 PBKDF2를 쓰되, 테스트 속도를 위해 반복 횟수를 줄인다.
    private final PasswordEncoder passwordEncoder =
            new Pbkdf2PasswordEncoder("", 16, 1_000, SecretKeyFactoryAlgorithm.PBKDF2WithHmacSHA256);
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
    @DisplayName("전각 문자 닉네임은 반각 문자 닉네임과 다른 회원이다")
    void doesNotNormalizeFullWidthNickname() {
        LoginResponse fullWidth = login("ｌｅｅ", null);
        LoginResponse halfWidth = login("lee", null);

        assertThat(fullWidth.member().name()).isEqualTo("ｌｅｅ");
        assertThat(halfWidth.member().memberId()).isNotEqualTo(fullWidth.member().memberId());
    }

    @Test
    @DisplayName("비밀번호를 빈 값으로 보내면 비밀번호 없는 회원으로 시작한다")
    void treatsEmptyPasswordAsNoPassword() {
        LoginResponse response = login("자취초보", "");

        assertThat(response.member().passwordProtected()).isFalse();
    }

    @Test
    @DisplayName("닉네임이나 비밀번호가 규칙에 맞지 않으면 회원을 만들지 않는다")
    void doesNotCreateMemberWhenInputIsInvalid() {
        assertThatThrownBy(() -> login("가".repeat(31), null))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_INVALID));
        assertThatThrownBy(() -> login("자취초보", "123"))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_PASSWORD_INVALID));
        assertThat(memberRepository.count()).isZero();
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
    @DisplayName("한글 30자 비밀번호로 가입하고 로그인한다")
    void supportsThirtyKoreanCharacterPassword() {
        String password = "가".repeat(30);
        LoginResponse first = login("보호닉네임", password);
        LoginResponse second = login("보호닉네임", password);

        assertThat(second.member().memberId()).isEqualTo(first.member().memberId());
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

    @Test
    @DisplayName("공유 회원이 있는 닉네임에 비밀번호와 함께 시작하면 별도의 보호 회원을 만든다")
    void createsProtectedMemberBesideSharedMember() {
        LoginResponse shared = login("11", null);
        LoginResponse protectedMember = login("11", "1111");

        assertThat(protectedMember.newMember()).isTrue();
        assertThat(protectedMember.member().passwordProtected()).isTrue();
        assertThat(protectedMember.member().memberId()).isNotEqualTo(shared.member().memberId());
        assertThat(memberRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("보호 회원이 있는 닉네임에 비밀번호 없이 시작하면 별도의 공유 회원을 만든다")
    void createsSharedMemberBesideProtectedMember() {
        LoginResponse protectedMember = login("11", "1111");
        LoginResponse shared = login("11", null);

        assertThat(shared.newMember()).isTrue();
        assertThat(shared.member().passwordProtected()).isFalse();
        assertThat(shared.member().memberId()).isNotEqualTo(protectedMember.member().memberId());
        assertThat(memberRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("공유 회원과 보호 회원이 모두 있으면 비밀번호 유무에 따라 각자의 회원으로 로그인한다")
    void logsInEachMemberByPasswordPresence() {
        LoginResponse shared = login("11", null);
        LoginResponse protectedMember = login("11", "1111");

        assertThat(login("11", null).member().memberId()).isEqualTo(shared.member().memberId());
        assertThat(login("11", "1111").member().memberId()).isEqualTo(protectedMember.member().memberId());
    }

    @Test
    @DisplayName("대소문자가 다른 닉네임은 다른 회원이다")
    void distinguishesNicknameCase() {
        LoginResponse upper = login("Lee", null);
        LoginResponse lower = login("lee", null);

        assertThat(lower.newMember()).isTrue();
        assertThat(lower.member().memberId()).isNotEqualTo(upper.member().memberId());
    }

    @Test
    @DisplayName("같은 닉네임으로 동시에 가입해 먼저 저장된 회원이 있으면 그 회원으로 로그인한다")
    void logsInMemberSavedByConcurrentRequest() {
        memberRepository.saveConcurrentlyBeforeNextSave(Member.create("자취초보", null, LocalDateTime.now(clock)));

        LoginResponse response = login("자취초보", null);

        assertThat(response.newMember()).isFalse();
        assertThat(memberRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("동시에 먼저 저장된 보호 회원과 비밀번호가 다르면 로그인에 실패한다")
    void rejectsWhenConcurrentProtectedMemberHasOtherPassword() {
        memberRepository.saveConcurrentlyBeforeNextSave(
                Member.create("보호닉네임", passwordEncoder.encode("1234"), LocalDateTime.now(clock)));

        assertThatThrownBy(() -> login("보호닉네임", "9999"))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_AUTHENTICATION_FAILED));
        assertThat(memberRepository.count()).isEqualTo(1);
    }

    private LoginResponse login(String nickname, String password) {
        return authService.loginNickname(new NicknameLoginRequest(nickname, password));
    }

    private static class InMemoryMemberRepository implements MemberRepository {

        private final Map<Long, Member> members = new LinkedHashMap<>();
        private long sequence;
        private Member concurrentMember;

        // 다음 저장 직전에 다른 요청이 같은 회원을 먼저 저장한 상황을 흉내 낸다.
        void saveConcurrentlyBeforeNextSave(Member member) {
            this.concurrentMember = member;
        }

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
        public Optional<Member> findByNicknameAndPasswordProtected(String nickname, boolean passwordProtected) {
            return members.values().stream()
                    .filter(member -> member.getNickname().equals(nickname))
                    .filter(member -> member.isPasswordProtected() == passwordProtected)
                    .findFirst();
        }

        @Override
        public Member save(Member member) {
            if (concurrentMember != null) {
                store(concurrentMember);
                concurrentMember = null;
                throw new DuplicateKeyException("uk_members_nickname_protection");
            }
            return store(member);
        }

        private Member store(Member member) {
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
