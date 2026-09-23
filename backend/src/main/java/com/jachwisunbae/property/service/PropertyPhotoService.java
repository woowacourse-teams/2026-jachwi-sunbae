package com.jachwisunbae.property.service;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.entity.PropertyPhoto;
import com.jachwisunbae.property.repository.PropertyPhotoRepository;
import com.jachwisunbae.property.repository.PropertyRepository;
import com.jachwisunbae.property.repository.query.PropertyPhotosQuery;
import com.jachwisunbae.property.service.dto.result.PropertyPhotoUploadResult;
import com.jachwisunbae.property.storage.PhotoContent;
import com.jachwisunbae.property.storage.PhotoFile;
import com.jachwisunbae.property.storage.PhotoStorage;
import com.jachwisunbae.property.storage.PhotoStorageKeyGenerator;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PropertyPhotoService {
    private final PropertyRepository propertyRepository;
    private final PropertyPhotoRepository propertyPhotoRepository;
    private final PhotoStorage photoStorage;
    private final PhotoStorageKeyGenerator storageKeyGenerator;
    private final Clock clock;

    public PropertyPhotoService(final PropertyRepository propertyRepository,
                                final PropertyPhotoRepository propertyPhotoRepository,
                                final PhotoStorage photoStorage,
                                final PhotoStorageKeyGenerator storageKeyGenerator,
                                final Clock clock) {
        this.propertyRepository = propertyRepository;
        this.propertyPhotoRepository = propertyPhotoRepository;
        this.photoStorage = photoStorage;
        this.storageKeyGenerator = storageKeyGenerator;
        this.clock = clock;
    }

    public PropertyPhotosQuery find(final Long memberId, final Long propertyId) {
        findOwnedProperty(memberId, propertyId);
        return new PropertyPhotosQuery(propertyId, propertyPhotoRepository.findByPropertyId(propertyId),
            propertyPhotoRepository.findRepresentativePhotoId(propertyId).orElse(null));
    }

    @Transactional
    public PropertyPhotoUploadResult upload(final Long memberId, final Long propertyId, final PhotoFile photoFile) {
        validateOwnedPropertyForUpload(memberId, propertyId);
        validatePhotoLimit(propertyId);

        String storageKey = storageKeyGenerator.generate(memberId, propertyId, photoFile);
        photoStorage.upload(storageKey, photoFile.bytes(), photoFile.contentType());
        try {
            PropertyPhoto saved = propertyPhotoRepository.save(memberId,
                PropertyPhoto.create(propertyId, storageKey, photoFile.contentType(), photoFile.size(),
                    LocalDateTime.now(clock)), photoFile.checksum());

            propertyPhotoRepository.ensureRepresentative(propertyId);
            boolean representative = propertyPhotoRepository.findRepresentativePhotoId(propertyId)
                .map(saved.getId()::equals)
                .orElse(false);
            return new PropertyPhotoUploadResult(saved, representative);
        } catch (RuntimeException exception) {
            try {
                photoStorage.delete(storageKey);
            } catch (RuntimeException compensationFailure) {
                exception.addSuppressed(compensationFailure);
            }
            throw exception;
        }
    }

    private void validateOwnedPropertyForUpload(final Long memberId, final Long propertyId) {
        propertyRepository.findByIdAndMemberIdForUpdate(propertyId, memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND,
                "매물을 찾을 수 없습니다."));
    }

    private void validatePhotoLimit(final Long propertyId) {
        if (propertyPhotoRepository.countByPropertyId(propertyId) >= 30) {
            throw new BusinessException(DomainErrorCode.PHOTO_LIMIT_EXCEEDED,
                "매물당 사진은 30장까지 업로드할 수 있습니다.");
        }
    }

    public PhotoContent findContent(final Long memberId, final Long propertyId, final Long photoId) {
        findOwnedProperty(memberId, propertyId);
        PropertyPhoto photo = findPhoto(propertyId, photoId);
        return new PhotoContent(photoStorage.download(photo.getStorageKey()), photo.getContentType());
    }

    @Transactional
    public void delete(final Long memberId, final Long propertyId, final Long photoId) {
        findOwnedProperty(memberId, propertyId);
        PropertyPhoto photo = findPhoto(propertyId, photoId);
        photoStorage.delete(photo.getStorageKey());
        propertyPhotoRepository.deleteById(photoId);
        propertyPhotoRepository.ensureRepresentative(propertyId);
    }

    @Transactional
    public void designateRepresentative(final Long memberId, final Long propertyId, final Long photoId) {
        findOwnedProperty(memberId, propertyId);
        propertyPhotoRepository.findByIdAndPropertyId(photoId, propertyId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PHOTO_NOT_FOUND,
                "사진을 찾을 수 없습니다."));
        propertyPhotoRepository.setRepresentative(propertyId, photoId);
    }

    private void findOwnedProperty(final Long memberId, final Long propertyId) {
        if (!propertyRepository.existsByIdAndMemberId(propertyId, memberId)) {
            throw new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND, "매물을 찾을 수 없습니다.");
        }
    }

    private PropertyPhoto findPhoto(final Long propertyId, final Long photoId) {
        return propertyPhotoRepository.findByIdAndPropertyId(photoId, propertyId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PHOTO_NOT_FOUND,
                "사진을 찾을 수 없습니다."));
    }

}
