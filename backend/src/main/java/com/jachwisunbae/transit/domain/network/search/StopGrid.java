package com.jachwisunbae.transit.domain.network.search;

import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.vo.Coordinate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.IntConsumer;

public final class StopGrid {

    private static final double CELL_DEGREES = 0.01;

    private final Map<Long, int[]> stopsByCell;

    public StopGrid(final List<GtfsStop> stops) {
        Map<Long, List<Integer>> cells = new HashMap<>();
        for (int stop = 0; stop < stops.size(); stop++) {
            Coordinate coordinate = stops.get(stop).coordinate();
            cells.computeIfAbsent(cell(row(coordinate.latitude()), column(coordinate.longitude())),
                    ignored -> new ArrayList<>()).add(stop);
        }
        this.stopsByCell = new HashMap<>();
        cells.forEach((cell, members) -> stopsByCell.put(cell,
                members.stream().mapToInt(Integer::intValue).toArray()));
    }

    public void forEachNear(final Coordinate coordinate, final IntConsumer action) {
        int row = row(coordinate.latitude());
        int column = column(coordinate.longitude());
        for (int dRow = -1; dRow <= 1; dRow++) {
            for (int dColumn = -1; dColumn <= 1; dColumn++) {
                int[] members = stopsByCell.get(cell(row + dRow, column + dColumn));
                if (members != null) {
                    for (int stop : members) {
                        action.accept(stop);
                    }
                }
            }
        }
    }

    private static int row(final double latitude) {
        return (int) Math.floor(latitude / CELL_DEGREES);
    }

    private static int column(final double longitude) {
        return (int) Math.floor(longitude / CELL_DEGREES);
    }

    private static long cell(final int row, final int column) {
        return ((long) row << 32) | (column & 0xffffffffL);
    }
}
