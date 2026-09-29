package com.jachwisunbae.auth.token;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;

//로그인 시 AuthService가 토큰을 만들 때 사용하고, 이후 요청에서는 JwtAuthenticationFilter가 토큰을 검증할 때 사용한다.
// JWT == Header.Payload.Signature
// Signature == 헤더 + 페이로드를 비밀키로 서명한 값
public class JwtTokenProvider {

    // JWT 발급시 서명하는 객체(JWT내용을 비밀키로 서명 -> 시그니처 생성
    private final JWSSigner signer;
    // 클라이언트가 가져온 JWT의 서명이 진짜인지 확인(클라JWT를 서명하고 다시검증해서, 우리 비밀키로 만든건지 확인)
    private final JWSVerifier verifier;
    private final String issuer;// 토큰 발행자
    private final String audience;// 누가 사용하도록 발급했는가
    private final long accessTokenSeconds;
    private final Clock clock;

    // 비밀키가 잘못되면 로그인할 때가 아니라 서버가 시작할 때 실패하도록 생성자에서 검사한다.
    public JwtTokenProvider(
            String secret,
            String issuer,
            String audience,
            long accessTokenSeconds,
            Clock clock) {
        byte[] secretBytes = secretBytes(secret);
        this.signer = createSigner(secretBytes);
        this.verifier = createVerifier(secretBytes);
        this.issuer = issuer;
        this.audience = audience;
        this.accessTokenSeconds = accessTokenSeconds;
        this.clock = clock;
    }

    public String createAccessToken(Long memberId) {
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), createClaims(memberId, clock.instant()));
            jwt.sign(signer);// 비밀키를 이미 가지고 있는 singer
            return jwt.serialize();
        } catch (JOSEException exception) {
            // 비밀키는 서버 시작 시 검사했으므로, 여기서 실패하면 클라이언트가 아니라 서버 문제다.
            throw new IllegalStateException("Access Token을 서명하지 못했습니다.", exception);
        }
    }

    public Long parseMemberId(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);//읽을 수 있는 JWT형태로 파싱.
            JWTClaimsSet claims = jwt.getJWTClaimsSet();//페이로드(클레임의 묶음)를 꺼냄
            if (!isValid(jwt, claims)) {
                throw invalidToken();
            }
            return Long.valueOf(claims.getSubject());
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw invalidToken();
        }
    }

    // 비밀키 문자열을 그대로 UTF-8 바이트로 바꿔 키로 쓴다.
    private static byte[] secretBytes(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET이 필요합니다.");
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    // HS256은 32바이트 이상의 키가 필요하다. 짧으면 MACSigner가 예외를 던진다.
    //JWT의 HS256 서명은 문자열이 아니라 바이트 키로 동작한다.
    private static JWSSigner createSigner(byte[] secret) {
        try {
            return new MACSigner(secret);
        } catch (JOSEException exception) {//서버문제
            throw new IllegalStateException("JWT_SECRET은 32바이트 이상이어야 합니다.", exception);
        }
    }

    private static JWSVerifier createVerifier(byte[] secret) {
        try {
            return new MACVerifier(secret);
        } catch (JOSEException exception) {//서버문제
            throw new IllegalStateException("JWT_SECRET은 32바이트 이상이어야 합니다.", exception);
        }
    }

    private JWTClaimsSet createClaims(Long memberId, Instant issuedAt) {
        return new JWTClaimsSet.Builder()
                .subject(memberId.toString())
                .issuer(issuer)
                .audience(audience)
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(issuedAt.plusSeconds(accessTokenSeconds)))
                .build();
    }

    private boolean isValid(SignedJWT jwt, JWTClaimsSet claims) throws JOSEException {
        return jwt.verify(verifier) //Header + Payload를 비밀키로 다시 서명해보고, 그 결과가 JWT의 Signature와 같은지 확인
                && issuer.equals(claims.getIssuer())
                && claims.getAudience().contains(audience)
                && claims.getExpirationTime().toInstant().isAfter(clock.instant());
    }

    private BusinessException invalidToken() {//클라 문제
        return new BusinessException(DomainErrorCode.ACCESS_TOKEN_INVALID, "Access Token이 올바르지 않습니다.");
    }
}
