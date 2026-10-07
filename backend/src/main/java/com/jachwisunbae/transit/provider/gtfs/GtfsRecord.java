package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.GtfsTransfer;
import com.jachwisunbae.transit.provider.gtfs.sample.UsedStops;
import java.util.Optional;
import java.util.Set;
import org.apache.commons.csv.CSVRecord;

class GtfsRecord {

    // route_type 1은 지하철·도시철도, 3은 GTFS 표준 버스이고 KTDB 데이터는 버스에 0도 쓴다. 2(일반철도) 등은 뺀다.
    private static final Set<String> TRANSIT_ROUTE_TYPES = Set.of("0", "1", "3");

    private final CSVRecord row;

    GtfsRecord(final CSVRecord row) {
        this.row = row;
    }

    String text(final String column) {
        return row.get(column);
    }

    // GTFS 시각은 막차를 표현하려고 24시를 넘길 수 있어(예: 25:10:00) LocalTime으로 파싱하지 않는다.
    int seconds(final String column) {
        String[] parts = text(column).split(":");
        return Integer.parseInt(parts[0]) * 3600
                + Integer.parseInt(parts[1]) * 60
                + Integer.parseInt(parts[2]);
    }

    Optional<GtfsRoute> toRoute() {
        String routeType = text("route_type");
        if (!TRANSIT_ROUTE_TYPES.contains(routeType)) {
            return Optional.empty();
        }
        return Optional.of(new GtfsRoute(text("route_id"), text("route_short_name"), text("route_long_name"),
                Integer.parseInt(routeType), GtfsRoute.DEFAULT_WAIT_SECONDS));
    }

    Optional<GtfsStop> toStop(final UsedStops usedStops) {
        if (!usedStops.contains(text("stop_id"))) {
            return Optional.empty();
        }
        return Optional.of(new GtfsStop(text("stop_id"), text("stop_name"),
                Double.parseDouble(text("stop_lat")), Double.parseDouble(text("stop_lon"))));
    }

    Optional<GtfsTransfer> toTransfer(final UsedStops usedStops) {
        String from = text("from_stop_id");
        String to = text("to_stop_id");
        if (!usedStops.contains(from) || !usedStops.contains(to)) {
            return Optional.empty();
        }
        return Optional.of(new GtfsTransfer(from, to, Integer.parseInt(text("min_transfer_time"))));
    }
}
