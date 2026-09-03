package com.jachwisunbae.auth.service;

import com.jachwisunbae.auth.controller.dto.LoginMemberResponse;
import com.jachwisunbae.auth.controller.dto.LoginResponse;
import com.jachwisunbae.auth.controller.dto.NicknameLoginRequest;
import com.jachwisunbae.auth.nickname.NicknameLoginAttemptLimiter;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.entity.Member;
import com.jachwisunbae.member.repository.MemberRepository;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private static final int MIN_PASSWORD_LENGTH = 4;
    private static final int MAX_PASSWORD_LENGTH = 64;
    private static final int BCRYPT_MAX_BYTES = 72;
    private static final int MAX_NICKNAME_LENGTH = 50;

    private final MemberRepository memberRepository;
    private final NicknameLoginAttemptLimiter attemptLimiter;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtProvider;
    private final Clock clock;
    private final long accessTokenSeconds;

    public AuthService(
            MemberRepository memberRepository,
            NicknameLoginAttemptLimiter attemptLimiter,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtProvider,
            Clock clock,
            @Value("${auth.jwt.access-token-seconds}") long accessTokenSeconds) {
        this.memberRepository = memberRepository;
        this.attemptLimiter = attemptLimiter;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.clock = clock;
        this.accessTokenSeconds = accessTokenSeconds;
    }

    @Transactional
    public synchronized LoginResponse loginNickname(NicknameLoginRequest request) {
        String nickname = normalizeNickname(request.nickname());
        String password = normalizePassword(request.password());
        attemptLimiter.checkAllowed(nickname);

        Member existing = memberRepository.findByNickname(nickname).orElse(null);
        if (existing == null) {
            return createMember(nickname, password);
        }
        return loginExisting(existing, password);
    }

    private LoginResponse createMember(String nickname, String password) {
        LocalDateTime now = LocalDateTime.now(clock);
        String passwordHash = password == null ? null : passwordEncoder.encode(password);
        Member member = memberRepository.save(Member.create(nickname, passwordHash, now));
        attemptLimiter.reset(nickname);
        return createLoginResponse(member, true);
    }

    private LoginResponse loginExisting(Member member, String password) {
        if (!member.isPasswordProtected() && password != null) {
            throw new BusinessException(DomainErrorCode.NICKNAME_PASSWORD_UNEXPECTED,
                    "비밀번호 없이 사용하는 기존 닉네임에는 비밀번호를 입력할 수 없습니다.");
        }
        if (member.isPasswordProtected() && !matches(password, member.getPasswordHash())) {
            attemptLimiter.recordFailure(member.getNickname());
            throw new BusinessException(DomainErrorCode.NICKNAME_AUTHENTICATION_FAILED,
                    "닉네임 또는 비밀번호가 일치하지 않습니다.");
        }
        attemptLimiter.reset(member.getNickname());
        return createLoginResponse(member, false);
    }

    private boolean matches(String password, String passwordHash) {
        if (password == null) {
            return false;
        }
        try {
            return passwordEncoder.matches(password, passwordHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String normalizeNickname(String rawNickname) {
        if (rawNickname == null) {
            throw invalidNickname();
        }
        String normalized = Normalizer.normalize(rawNickname, Normalizer.Form.NFKC).trim();
        if (normalized.isEmpty()
                || normalized.codePointCount(0, normalized.length()) > MAX_NICKNAME_LENGTH
                || normalized.codePoints().anyMatch(Character::isISOControl)) {
            throw invalidNickname();
        }
        return normalized;
    }

    private BusinessException invalidNickname() {
        return new BusinessException(DomainErrorCode.NICKNAME_INVALID,
                "닉네임은 trim 후 1자 이상 50자 이하이고 제어 문자를 포함하지 않아야 합니다.");
    }

    private String normalizePassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return null;
        }
        int length = rawPassword.codePointCount(0, rawPassword.length());
        int bytes = rawPassword.getBytes(StandardCharsets.UTF_8).length;
        if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH || bytes > BCRYPT_MAX_BYTES) {
            throw new BusinessException(DomainErrorCode.NICKNAME_PASSWORD_INVALID,
                    "비밀번호는 4자 이상 64자 이하이고 UTF-8 72바이트 이하여야 합니다.");
        }
        return rawPassword;
    }

    private LoginResponse createLoginResponse(Member member, boolean newMember) {
        return new LoginResponse(
                jwtProvider.createAccessToken(member.getId()),
                "Bearer",
                accessTokenSeconds,
                newMember,
                new LoginMemberResponse(member.getId(), member.getNickname(), member.isPasswordProtected()));
    }
}
