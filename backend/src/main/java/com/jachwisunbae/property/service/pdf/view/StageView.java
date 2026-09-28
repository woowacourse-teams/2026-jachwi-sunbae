package com.jachwisunbae.property.service.pdf.view;

import java.util.List;

public record StageView(int index, String label, boolean applied, String checklistName,
                        String progress, List<CheckItemView> items) {
}
