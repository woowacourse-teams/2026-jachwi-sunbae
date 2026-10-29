package com.jachwisunbae.transit.repository;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.GtfsFeed;
import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.GtfsTransfer;
import java.util.List;
import java.util.function.Consumer;

public interface GtfsNetworkRepository {

    void replace(GtfsFeed feed);

    List<GtfsStop> findStops();

    List<GtfsRoute> findRoutes();

    void forEachEdge(Consumer<GtfsEdge> consumer);

    List<GtfsTransfer> findTransfers();

    void updateAdminDongCodes(List<GtfsStop> stops);
}
