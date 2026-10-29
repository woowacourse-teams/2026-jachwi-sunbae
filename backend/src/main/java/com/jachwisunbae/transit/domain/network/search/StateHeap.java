package com.jachwisunbae.transit.domain.network.search;

import java.util.Arrays;

public final class StateHeap {

    private int[] states = new int[1 << 12];
    private int[] seconds = new int[1 << 12];
    private int size;

    public boolean isEmpty() {
        return size == 0;
    }

    public int topState() {
        return states[0];
    }

    public int topSeconds() {
        return seconds[0];
    }

    public void push(final int state, final int time) {
        if (size == states.length) {
            states = Arrays.copyOf(states, size * 2);
            seconds = Arrays.copyOf(seconds, size * 2);
        }
        int child = size++;
        while (child > 0) {
            int parent = (child - 1) / 2;
            if (seconds[parent] <= time) {
                break;
            }
            states[child] = states[parent];
            seconds[child] = seconds[parent];
            child = parent;
        }
        states[child] = state;
        seconds[child] = time;
    }

    public void removeTop() {
        size--;
        if (size == 0) {
            return;
        }
        int lastState = states[size];
        int lastSeconds = seconds[size];
        int parent = 0;
        while (true) {
            int child = parent * 2 + 1;
            if (child >= size) {
                break;
            }
            if (child + 1 < size && seconds[child + 1] < seconds[child]) {
                child++;
            }
            if (seconds[child] >= lastSeconds) {
                break;
            }
            states[parent] = states[child];
            seconds[parent] = seconds[child];
            parent = child;
        }
        states[parent] = lastState;
        seconds[parent] = lastSeconds;
    }
}
