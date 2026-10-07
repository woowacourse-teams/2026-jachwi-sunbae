package com.jachwisunbae.transit.domain;

public record GtfsTransfer(String fromStopId, String toStopId, int seconds) {
}
