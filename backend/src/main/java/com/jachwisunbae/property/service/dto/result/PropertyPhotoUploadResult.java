package com.jachwisunbae.property.service.dto.result;

import com.jachwisunbae.property.entity.photo.PropertyPhoto;

public record PropertyPhotoUploadResult(PropertyPhoto photo, boolean representative) {
}
