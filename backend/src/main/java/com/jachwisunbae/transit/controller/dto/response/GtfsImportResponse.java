package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;

public record GtfsImportResponse(int routeCount, int stopCount, int edgeCount, int transferCount) {

    public static GtfsImportResponse from(final GtfsImportResult result) {
        return new GtfsImportResponse(result.routeCount(), result.stopCount(),
                result.edgeCount(), result.transferCount());
    }
}
