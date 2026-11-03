package com.jachwisunbae.notification.provider;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.json.gson.GsonFactory;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.jachwisunbae.notification.provider.WeatherPushSender.Push;
import com.jachwisunbae.notification.provider.fcm.FirebaseWeatherPushSender;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class FirebaseWeatherPushSenderTest {
    private final FirebaseMessaging messaging = mock(FirebaseMessaging.class);
    private final FirebaseWeatherPushSender sender = new FirebaseWeatherPushSender(messaging);

    @Test
    @DisplayName("제목·본문과 알림 식별 정보를 담아 보낸다")
    void sendsTitleBodyAndClickIdentity() throws Exception {
        Push push = push();
        when(messaging.send(any(Message.class))).thenReturn("projects/test/messages/123");
        boolean result = sender.send(push);
        assertThat(result).isTrue();
        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messaging).send(captor.capture());
        JsonNode json = new ObjectMapper().readTree(GsonFactory.getDefaultInstance().toString(captor.getValue()));
        assertThat(json.at("/token").asText()).isEqualTo(push.token());
        assertThat(json.at("/data/notificationId").asText()).isEqualTo(push.notificationId().toString());
        assertThat(json.at("/notification/title").asText()).isEqualTo(push.title());
        assertThat(json.at("/notification/body").asText()).isEqualTo(push.body());
        assertThat(json.get("data").size()).isOne();
        assertThat(json.has("android")).isFalse();
        assertThat(json.has("apns")).isFalse();
        assertThat(json.get("data").toString()).doesNotContain("token", "grid", "member", "latitude", "longitude");
        assertThat(push.toString()).doesNotContain(push.token());
    }

    @Test
    @DisplayName("발송이 실패하면 다시 보내지 않고 실패만 돌려준다")
    void failedRequestIsReturnedWithoutRetryOrSensitiveExceptionText() throws Exception {
        when(messaging.send(any(Message.class))).thenThrow(new IllegalStateException("sensitive-provider-response"));
        boolean result = sender.send(push());
        assertThat(result).isFalse();
        verify(messaging).send(any(Message.class));
    }

    @Test
    @DisplayName("Firebase 오류가 나도 다시 보내지 않는다")
    void firebaseFailureIsNotRetried() throws Exception {
        when(messaging.send(any(Message.class))).thenThrow(mock(FirebaseMessagingException.class));
        assertThat(sender.send(push())).isFalse();
        verify(messaging).send(any(Message.class));
    }

    private Push push() {
        return new Push(UUID.randomUUID(), "fake-fcm-test-token-1234567890", "오늘 15시 비 예보", "우산을 준비하세요");
    }
}
