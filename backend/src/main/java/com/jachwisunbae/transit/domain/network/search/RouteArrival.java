package com.jachwisunbae.transit.domain.network.search;

import com.jachwisunbae.transit.domain.vo.Seconds;
import java.util.Map;

public final class RouteArrival {

    private final SearchStates states;
    private final Map<Integer, Integer> walkSeconds;
    private final Seconds limit;
    private int state = SearchStates.NONE;
    private int seconds = Integer.MAX_VALUE;

    public RouteArrival(final SearchStates states, final Map<Integer, Integer> walkSeconds, final Seconds limit) {
        this.states = states;
        this.walkSeconds = walkSeconds;
        this.limit = limit;
    }

    // 걸어서 온 상태(도보 환승 직후)에서는 걷기를 이어 붙이지 않으므로 목적지까지 걸어가지 않는다.
    public boolean visit(final int candidate, final int current, final boolean walked) {
        if (current >= seconds) {
            return false;
        }
        Integer walk = walkSeconds.get(states.stop(candidate));
        if (!walked && walk != null && current + walk <= limit.value() && current + walk < seconds) {
            state = candidate;
            seconds = current + walk;
        }
        return true;
    }

    public int state() {
        return state;
    }

    public int seconds() {
        return seconds;
    }
}
