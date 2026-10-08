package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.InternalSystemException;
import com.jachwisunbae.transit.domain.GtfsFeed;
import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.provider.gtfs.sample.StopTimeSamples;
import com.jachwisunbae.transit.provider.gtfs.sample.UsedStops;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.List;
import org.springframework.stereotype.Component;

// KTDB(국가교통DB) GTFS 디렉터리를 읽어 버스·지하철 노선망으로 정리한다.
@Component
public class GtfsFeedReader {

    public GtfsFeed read(final Path directory) {
        try {
            return read(new GtfsFiles(directory));
        } catch (UncheckedIOException exception) {
            throw new InternalSystemException(ErrorCode.TRANSIT_FEED_READ_FAILURE,
                    "GTFS 파일을 읽지 못했습니다. directory=" + directory, exception.getCause());
        }
    }

    private GtfsFeed read(final GtfsFiles files) {
        List<GtfsRoute> routes = files.read("routes.txt", GtfsRecord::toRoute);
        StopTimeSamples samples = TripRoutes.read(files, routes).collectStopTimes(files);
        UsedStops usedStops = samples.usedStops();
        return new GtfsFeed(samples.applyWaits(routes),
                files.read("stops.txt", record -> record.toStop(usedStops)),
                samples.medianEdges(),
                files.read("transfers.txt", record -> record.toTransfer(usedStops)));
    }
}
