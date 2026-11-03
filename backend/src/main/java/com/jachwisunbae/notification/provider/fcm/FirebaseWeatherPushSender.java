package com.jachwisunbae.notification.provider.fcm;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.jachwisunbae.notification.provider.WeatherPushSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FirebaseWeatherPushSender implements WeatherPushSender {
    private static final Logger LOG = LoggerFactory.getLogger(FirebaseWeatherPushSender.class);
    private final FirebaseMessaging messaging;

    public FirebaseWeatherPushSender(final FirebaseMessaging messaging) {
        this.messaging = messaging;
    }

    @Override
    public boolean send(final Push push) {
        Message message = Message.builder().setToken(push.token())
                .setNotification(Notification.builder().setTitle(push.title()).setBody(push.body()).build())
                .putData("notificationId", push.notificationId().toString()).build();
        try {
            messaging.send(message);
            return true;
        } catch (FirebaseMessagingException exception) {
            // 예외 원문·cause·토큰 없이 Firebase의 분류 코드만 남긴다.
            LOG.warn("weather-push-failed code={}", exception.getMessagingErrorCode());
            return false;
        } catch (RuntimeException exception) {
            LOG.warn("weather-push-failed code=CLIENT_ERROR");
            return false;
        }
    }
}
