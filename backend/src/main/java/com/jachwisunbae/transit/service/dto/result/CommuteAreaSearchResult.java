package com.jachwisunbae.transit.service.dto.result;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.transit.domain.CommuteArea;
import java.util.List;

public record CommuteAreaSearchResult(int maxMinutes, List<CommuteArea> areas, AdminDongRents rents) {
}
