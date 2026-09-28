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
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

public class JwtTokenProvider {

    private final JWSSigner signer;
    private final JWSVerifier verifier;
    private final String issuer;
    private final String audience;
    private final long accessTokenSeconds;
    private final Clock clock;

    // 비밀키가 잘못되면 로그인할 때가 아니라 서버가 시작할 때 실패하도록 생성자에서 검사한다.
    public JwtTokenProvider(
            String base64Secret,
            String issuer,
            String audience,
            long accessTokenSeconds,
            Clock clock) {
        byte[] secret = decodeSecret(base64Secret);
        this.signer = createSigner(secret);
        this.verifier = createVerifier(secret);
        this.issuer = issuer;
        this.audience = audience;
        this.accessTokenSeconds = accessTokenSeconds;
        this.clock = clock;
    }

    public String createAccessToken(Long memberId) {
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), createClaims(memberId, clock.instant()));
            jwt.sign(signer);
            return jwt.serialize();
        } catch (JOSEException exception) {
            // 비밀키는 서버 시작 시 검사했으므로, 여기서 실패하면 클라이언트가 아니라 서버 문제다.
            throw new IllegalStateException("Access Token을 서명하지 못했습니다.", exception);
        }
    }

    public Long parseMemberId(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
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

    private static byte[] decodeSecret(String base64Secret) {
        try {
            return Base64.getDecoder().decode(base64Secret);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new IllegalStateException("JWT_SECRET_BASE64는 Base64로 인코딩한 값이어야 합니다. "
                    + "openssl rand -base64 32로 만들 수 있습니다.", exception);
        }
    }

    // HS256은 32바이트 이상의 키가 필요하다. 짧으면 MACSigner가 예외를 던진다.
    private static JWSSigner createSigner(byte[] secret) {
        try {
            return new MACSigner(secret);
        } catch (JOSEException exception) {
            throw new IllegalStateException("JWT 비밀키는 Base64로 디코딩한 값이 32바이트 이상이어야 합니다.", exception);
        }
    }

    private static JWSVerifier createVerifier(byte[] secret) {
        try {
            return new MACVerifier(secret);
        } catch (JOSEException exception) {
            throw new IllegalStateException("JWT 비밀키는 Base64로 디코딩한 값이 32바이트 이상이어야 합니다.", exception);
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
        return jwt.verify(verifier)
                && issuer.equals(claims.getIssuer())
                && claims.getAudience().contains(audience)
                && claims.getExpirationTime().toInstant().isAfter(clock.instant());
    }

    private BusinessException invalidToken() {
        return new BusinessException(DomainErrorCode.ACCESS_TOKEN_INVALID, "Access Token이 올바르지 않습니다.");
    }
}
