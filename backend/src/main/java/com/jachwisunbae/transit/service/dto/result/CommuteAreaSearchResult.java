package com.jachwisunbae.transit.service.dto.result;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.transit.domain.CommuteArea;
import java.util.List;

// 동네마다 대표 법정동의 월세 시세를 rents에서 행정동 코드로 찾는다. 시세가 없으면 비어 있다.
public record CommuteAreaSearchResult(int maxMinutes, List<CommuteArea> areas, AdminDongRents rents) {
}
