package com.jachwisunbae.map.provider.publicdata.sgis;

import java.time.Instant;

// SGIS 인증 API가 발급한 토큰과 만료 시각
record SgisAccessToken(String value, Instant expiresAt) {
}
