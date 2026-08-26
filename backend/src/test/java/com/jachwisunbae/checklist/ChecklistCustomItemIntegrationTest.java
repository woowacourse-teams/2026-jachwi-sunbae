package com.jachwisunbae.checklist;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.common.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

class ChecklistCustomItemIntegrationTest extends IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void 사용자_직접_질문으로_체크리스트를_생성할_수_없다() throws Exception {
        String token = nicknameLoginToken("제공항목테스터");

        mockMvc.perform(post("/api/checklists")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"직접 질문 목록",
                                  "stage":"ONLINE_PHONE",
                                  "items":[{"systemCheckItemId":null,"question":"창틀 곰팡이는 괜찮은가?"}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CHECKLIST_ITEMS_INVALID"));
    }

    @Test
    void 이전_직접_질문은_문구를_바꾸지_않는_경우에만_수정_요청에서_보존한다() throws Exception {
        String token = nicknameLoginToken("이전항목테스터");
        long memberId = memberId(token);
        jdbcTemplate.update("INSERT INTO user_checklists (member_id, name, stage) VALUES (?, ?, ?)",
                memberId, "이전 체크리스트", "ONLINE_PHONE");
        long checklistId = jdbcTemplate.queryForObject(
                "SELECT MAX(id) FROM user_checklists WHERE member_id = ?", Long.class, memberId);
        jdbcTemplate.update("""
                INSERT INTO user_checklist_items
                    (user_checklist_id, system_check_item_id, stage, item_type, question, display_order)
                VALUES (?, NULL, 'ONLINE_PHONE', 'OPTIONAL', '이전에 만든 질문', 1)
                """, checklistId);

        mockMvc.perform(put("/api/checklists/{checklistId}", checklistId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"이전 체크리스트",
                                  "items":[{"systemCheckItemId":null,"question":"이전에 만든 질문"}]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].origin").value("CUSTOM"))
                .andExpect(jsonPath("$.data.items[0].question").value("이전에 만든 질문"));

        mockMvc.perform(put("/api/checklists/{checklistId}", checklistId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"이전 체크리스트",
                                  "items":[{"systemCheckItemId":null,"question":"바꾼 질문"}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CHECKLIST_ITEMS_INVALID"));
    }

    @Test
    void 시스템_ID와_질문을_동시에_보낸_항목은_거절한다() throws Exception {
        String token = nicknameLoginToken("잘못된질문테스터");
        mockMvc.perform(post("/api/checklists")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"잘못된 목록",
                                  "stage":"ONLINE_PHONE",
                                  "items":[{"systemCheckItemId":101,"question":"동시에 보낸 질문"}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CHECKLIST_ITEMS_INVALID"));
    }

    private String nicknameLoginToken(String nickname) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/nickname")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"" + nickname + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsByteArray())
                .path("data").path("accessToken").asText();
    }

    private long memberId(String token) throws Exception {
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        return objectMapper.readTree(payload).path("sub").asLong();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
