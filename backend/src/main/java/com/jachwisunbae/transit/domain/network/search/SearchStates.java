package com.jachwisunbae.transit.domain.network.search;

import java.util.Arrays;

public final class SearchStates {

    public static final int NONE = -1;

    private static final int INITIAL_CAPACITY = 1 << 12;
    private static final int ROUTE_BITS = 20;
    private static final int BOARDING_BITS = 4;
    public static final int MAX_ROUTES = (1 << ROUTE_BITS) - 1;
    public static final int MAX_BOARDINGS = (1 << BOARDING_BITS) - 1;

    private int[] slots = emptySlots(INITIAL_CAPACITY * 2);
    private long[] keys = new long[INITIAL_CAPACITY];
    private int[] seconds = new int[INITIAL_CAPACITY];
    private int[] previous = new int[INITIAL_CAPACITY];
    private int[] links = new int[INITIAL_CAPACITY];
    private int[] waits = new int[INITIAL_CAPACITY];
    private int size;

    public static long key(final int stop, final int route, final int boardings) {
        return ((long) stop << (ROUTE_BITS + BOARDING_BITS)) | ((long) (route + 1) << BOARDING_BITS) | boardings;
    }

    public int stop(final int state) {
        return (int) (keys[state] >>> (ROUTE_BITS + BOARDING_BITS));
    }

    public int route(final int state) {
        return (int) ((keys[state] >>> BOARDING_BITS) & MAX_ROUTES) - 1;
    }

    public int boardings(final int state) {
        return (int) (keys[state] & MAX_BOARDINGS);
    }

    public int seconds(final int state) {
        return seconds[state];
    }

    public int previous(final int state) {
        return previous[state];
    }

    public int link(final int state) {
        return links[state];
    }

    public int waitSeconds(final int state) {
        return waits[state];
    }

    public int find(final long key) {
        for (int slot = slotOf(key, slots.length); slots[slot] != NONE; slot = (slot + 1) & (slots.length - 1)) {
            if (keys[slots[slot]] == key) {
                return slots[slot];
            }
        }
        return NONE;
    }

    public int findOrInsert(final long key) {
        int found = find(key);
        if (found != NONE) {
            return found;
        }
        if (size == keys.length) {
            grow();
        }
        keys[size] = key;
        seconds[size] = Integer.MAX_VALUE;
        previous[size] = NONE;
        place(size, slots);
        return size++;
    }

    public void update(final int state, final int newSeconds, final int previousState, final int link, final int wait) {
        seconds[state] = newSeconds;
        previous[state] = previousState;
        links[state] = link;
        waits[state] = wait;
    }

    private void grow() {
        int capacity = keys.length * 2;
        keys = Arrays.copyOf(keys, capacity);
        seconds = Arrays.copyOf(seconds, capacity);
        previous = Arrays.copyOf(previous, capacity);
        links = Arrays.copyOf(links, capacity);
        waits = Arrays.copyOf(waits, capacity);
        int[] newSlots = emptySlots(capacity * 2);
        for (int state = 0; state < size; state++) {
            place(state, newSlots);
        }
        slots = newSlots;
    }

    private void place(final int state, final int[] target) {
        int slot = slotOf(keys[state], target.length);
        while (target[slot] != NONE) {
            slot = (slot + 1) & (target.length - 1);
        }
        target[slot] = state;
    }

    private static int slotOf(final long key, final int length) {
        long mixed = key * 0x9E3779B97F4A7C15L;
        return (int) (mixed >>> 32) & (length - 1);
    }

    private static int[] emptySlots(final int length) {
        int[] slots = new int[length];
        Arrays.fill(slots, NONE);
        return slots;
    }
}
