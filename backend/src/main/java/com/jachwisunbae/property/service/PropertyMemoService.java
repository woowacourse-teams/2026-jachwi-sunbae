package com.jachwisunbae.property.service;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.controller.dto.request.UpdatePropertyMemoRequest;
import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PropertyMemoService {

    private final PropertyRepository propertyRepository;

    public PropertyMemoService(final PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    public String find(final Long memberId, final Long propertyId) {
        return findOwnedProperty(memberId, propertyId).getMemo();
    }

    @Transactional
    public String update(final Long memberId, final Long propertyId,
                         final UpdatePropertyMemoRequest request) {
        Property property = findOwnedProperty(memberId, propertyId);
        property.replaceMemo(request.freeMemo());
        propertyRepository.updateMemo(property);
        return property.getMemo();
    }

    private Property findOwnedProperty(final Long memberId, final Long propertyId) {
        return propertyRepository.findByIdAndMemberId(propertyId, memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND,
                "매물을 찾을 수 없습니다."));
    }
}
