package com.jachwisunbae.auth.service;

import com.jachwisunbae.auth.domain.Password;
import com.jachwisunbae.auth.service.dto.command.NicknameLoginCommand;
import com.jachwisunbae.auth.service.dto.result.LoginResult;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.member.entity.Member;
import com.jachwisunbae.member.entity.Nickname;
import com.jachwisunbae.member.repository.MemberRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// 조회와 저장을 트랜잭션으로 묶지 않는다. 동시 가입은 DB 유니크 제약이 막고, 충돌한 뒤 다시 조회할 때
// 먼저 저장된 회원이 보여야 하기 때문이다. 트랜잭션 안에서는 MySQL이 처음 조회한 시점의 데이터를 계속 보여준다.
@Service
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

    public LoginResult loginNickname(NicknameLoginCommand command) {
        String nickname = Nickname.from(command.nickname()).value();
        String password = password(command.password());

        try {
            return login(nickname, password);
        } catch (DuplicateKeyException exception) {
            // 같은 닉네임으로 동시에 가입하면 한 요청만 저장된다.
            // 먼저 저장된 회원이 있을 때만 닉네임 충돌로 보고 다시 로그인한다.
            // 회원이 없으면 다른 유니크 제약 위반이므로 그대로 던진다.
            boolean passwordProtected = password != null;
            if (memberRepository.findByNicknameAndPasswordProtected(nickname, passwordProtected).isEmpty()) {
                throw exception;
            }
            return login(nickname, password);
        }
    }

    private LoginResult login(String nickname, String password) {
        if (password == null) {
            return loginSharedMember(nickname);
        }
        return loginProtectedMember(nickname, password);
    }

    // 비밀번호 없이 시작하면 그 닉네임의 공유 회원으로 시작하고, 없으면 만든다.
    private LoginResult loginSharedMember(String nickname) {
        Optional<Member> sharedMember = memberRepository.findByNicknameAndPasswordProtected(nickname, false);
        if (sharedMember.isPresent()) {
            return createLoginResult(sharedMember.get(), false);
        }
        return createMember(nickname, null);
    }

    // 비밀번호와 함께 시작하면 그 닉네임의 보호 회원으로 시작한다. 없으면 만들고, 있으면 비밀번호가 맞아야 한다.
    private LoginResult loginProtectedMember(String nickname, String password) {
        Optional<Member> protectedMember = memberRepository.findByNicknameAndPasswordProtected(nickname, true);
        if (protectedMember.isEmpty()) {
            return createMember(nickname, passwordEncoder.encode(password));
        }
        if (!matches(password, protectedMember.get().getPasswordHash())) {
            throw new BusinessException(ErrorCode.NICKNAME_AUTHENTICATION_FAILED,
                    "닉네임 또는 비밀번호가 일치하지 않습니다.");
        }
        return createLoginResult(protectedMember.get(), false);
    }

    private LoginResult createMember(String nickname, String passwordHash) {
        LocalDateTime now = LocalDateTime.now(clock);
        Member member = memberRepository.save(Member.create(nickname, passwordHash, now));
        return createLoginResult(member, true);
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

    private LoginResult createLoginResult(Member member, boolean newMember) {
        return new LoginResult(jwtProvider.createAccessToken(member.getId()), accessTokenSeconds, newMember,
                member.getId(), member.getNickname(), member.isPasswordProtected());
    }
}
