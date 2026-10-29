package com.jachwisunbae.transit.domain.network.search;

import java.util.Arrays;

public final class StopLinks {

    public static final int TRANSFER = -1;

    private final int[] start;
    private final int[] other;
    private final int[] route;
    private final int[] seconds;

    private StopLinks(final int[] start, final int[] other, final int[] route, final int[] seconds) {
        this.start = start;
        this.other = other;
        this.route = route;
        this.seconds = seconds;
    }

    public static StopLinks groupBy(final int stopCount, final int count, final int[] group, final int[] other,
                             final int[] route, final int[] seconds) {
        int[] start = groupStart(stopCount, count, group);
        int[] order = groupOrder(count, group, start);
        return new StopLinks(start, pick(other, order), pick(route, order), pick(seconds, order));
    }

    public int start(final int stop) {
        return start[stop];
    }

    public int end(final int stop) {
        return start[stop + 1];
    }

    public int other(final int link) {
        return other[link];
    }

    public int route(final int link) {
        return route[link];
    }

    public int seconds(final int link) {
        return seconds[link];
    }

    public boolean isTransfer(final int link) {
        return route[link] == TRANSFER;
    }

    private static int[] groupStart(final int stopCount, final int count, final int[] group) {
        int[] start = new int[stopCount + 1];
        for (int i = 0; i < count; i++) {
            start[group[i] + 1]++;
        }
        for (int stop = 0; stop < stopCount; stop++) {
            start[stop + 1] += start[stop];
        }
        return start;
    }

    private static int[] groupOrder(final int count, final int[] group, final int[] start) {
        int[] cursor = Arrays.copyOf(start, start.length);
        int[] order = new int[count];
        for (int i = 0; i < count; i++) {
            order[cursor[group[i]]++] = i;
        }
        return order;
    }

    private static int[] pick(final int[] values, final int[] order) {
        int[] picked = new int[order.length];
        for (int i = 0; i < order.length; i++) {
            picked[i] = values[order[i]];
        }
        return picked;
    }
}
