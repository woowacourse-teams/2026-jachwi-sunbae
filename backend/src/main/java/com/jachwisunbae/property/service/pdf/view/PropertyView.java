package com.jachwisunbae.property.service.pdf.view;

import java.util.List;

public record PropertyView(int index, int total, String name, List<KeyValue> basics,
                           List<PhotoView> photos, String memo, List<StageView> stages) {
}
