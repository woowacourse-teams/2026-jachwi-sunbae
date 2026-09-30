package com.jachwisunbae.checklist.repository.query;

import com.jachwisunbae.checklist.entity.UserChecklistItem;

public record UserChecklistItemDetail(UserChecklistItem item, boolean active) {
}
