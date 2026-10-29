package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.GtfsTransfer;
import com.jachwisunbae.transit.domain.vo.Coordinate;
import com.jachwisunbae.transit.domain.vo.Seconds;
import org.apache.commons.csv.CSVRecord;

public class GtfsRecord {

    private final CSVRecord row;

    public GtfsRecord(final CSVRecord row) {
        this.row = row;
    }

    public String text(final String column) {
        return row.get(column);
    }

    public String optionalText(final String column) {
        if (!row.isMapped(column)) {
            return "";
        }
        return row.get(column);
    }

    public int integer(final String column) {
        return Integer.parseInt(text(column));
    }

    public int seconds(final String column) {
        String[] parts = text(column).split(":");
        return Integer.parseInt(parts[0]) * 3600
                + Integer.parseInt(parts[1]) * 60
                + Integer.parseInt(parts[2]);
    }

    public GtfsRoute toRoute() {
        return new GtfsRoute(text("route_id"), text("route_short_name"), text("route_long_name"),
                integer("route_type"), GtfsRoute.DEFAULT_WAIT_TIME);
    }

    public GtfsStop toStop() {
        Coordinate coordinate = new Coordinate(Double.parseDouble(text("stop_lat")),
                Double.parseDouble(text("stop_lon")));
        return new GtfsStop(text("stop_id"), text("stop_name"), coordinate);
    }

    public GtfsTransfer toTransfer() {
        return new GtfsTransfer(text("from_stop_id"), text("to_stop_id"), new Seconds(integer("min_transfer_time")));
    }
}
