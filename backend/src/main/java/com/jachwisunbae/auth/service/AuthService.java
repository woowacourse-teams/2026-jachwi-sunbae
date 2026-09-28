package com.jachwisunbae.auth.service;

import com.jachwisunbae.auth.controller.dto.LoginMemberResponse;
import com.jachwisunbae.auth.controller.dto.LoginResponse;
import com.jachwisunbae.auth.controller.dto.NicknameLoginRequest;
import com.jachwisunbae.auth.domain.Password;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.entity.Member;
import com.jachwisunbae.member.entity.Nickname;
import com.jachwisunbae.member.repository.MemberRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {


    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtProvider;
    private final Clock clock;
    private final long accessTokenSeconds;

    public AuthService(
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtProvider,
            Clock clock,
            @Value("${auth.jwt.access-token-seconds}") long accessTokenSeconds) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.clock = clock;
        this.accessTokenSeconds = accessTokenSeconds;
    }

    @Transactional
    public synchronized LoginResponse loginNickname(NicknameLoginRequest request) {
        String nickname = Nickname.from(request.nickname()).value();
        String password = password(request.password());

        if (password == null) {
            return loginSharedMember(nickname);
        }
        return loginProtectedMember(nickname, password);
    }

    // 비밀번호 없이 시작하면 그 닉네임의 공유 회원으로 시작하고, 없으면 만든다.
    private LoginResponse loginSharedMember(String nickname) {
        Optional<Member> sharedMember = memberRepository.findByNicknameAndPasswordProtected(nickname, false);
        if (sharedMember.isPresent()) {
            return createLoginResponse(sharedMember.get(), false);
        }
        return createMember(nickname, null);
    }

    // 비밀번호와 함께 시작하면 그 닉네임의 보호 회원으로 시작한다. 없으면 만들고, 있으면 비밀번호가 맞아야 한다.
    private LoginResponse loginProtectedMember(String nickname, String password) {
        Optional<Member> protectedMember = memberRepository.findByNicknameAndPasswordProtected(nickname, true);
        if (protectedMember.isEmpty()) {
            return createMember(nickname, passwordEncoder.encode(password));
        }
        if (!matches(password, protectedMember.get().getPasswordHash())) {
            throw new BusinessException(DomainErrorCode.NICKNAME_AUTHENTICATION_FAILED,
                    "닉네임 또는 비밀번호가 일치하지 않습니다.");
        }
        return createLoginResponse(protectedMember.get(), false);
    }

    private LoginResponse createMember(String nickname, String passwordHash) {
        LocalDateTime now = LocalDateTime.now(clock);
        Member member = memberRepository.save(Member.create(nickname, passwordHash, now));
        return createLoginResponse(member, true);
    }

    private boolean matches(String password, String passwordHash) {
        try {
            return passwordEncoder.matches(password, passwordHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    // 비밀번호를 생략하거나 빈 값으로 보내면 비밀번호 없이 시작한다.
    private String password(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            return null;
        }
        return Password.from(rawPassword).value();
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
