package com.giasu.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GrammarExerciseService {
    private static final List<String> TYPES = List.of("SINGLE_CHOICE", "FILL_BLANK", "REORDER_WORDS", "MATCHING", "ERROR_CORRECTION", "SHORT_SENTENCE");
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public GrammarExerciseService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> byLesson(String lessonId, String teacherId, String teacherEmail, boolean admin) {
        requireLessonOwner(lessonId, teacherId, teacherEmail, admin);
        return jdbc.query("""
            select * from "GrammarExercise"
            where "lessonId" = ?
            order by "orderIndex" asc, "createdAt" asc
            """, (rs, i) -> exerciseRow(rs), lessonId);
    }

    public List<Map<String, Object>> byBlock(String blockId, String teacherId, String teacherEmail, boolean admin) {
        String lessonId = lessonIdForBlock(blockId);
        if (lessonId == null) throw new IllegalStateException("Foundation lesson block not found");
        requireLessonOwner(lessonId, teacherId, teacherEmail, admin);
        return jdbc.query("""
            select * from "GrammarExercise"
            where "lessonBlockId" = ?
            order by "orderIndex" asc, "createdAt" asc
            """, (rs, i) -> exerciseRow(rs), blockId);
    }

    public Map<String, Object> one(String exerciseId, String teacherId, String teacherEmail, boolean admin) {
        Map<String, Object> exercise = find(exerciseId);
        if (exercise == null) return null;
        requireExerciseOwner(exercise, teacherId, teacherEmail, admin);
        return exercise;
    }

    @Transactional
    public Map<String, Object> createForLesson(String lessonId, Map<String, Object> body) {
        requireLessonOwner(lessonId, str(body.get("teacherId")), str(body.get("teacherEmail")), bool(body.get("admin")));
        return create(lessonId, null, body);
    }

    @Transactional
    public Map<String, Object> createForBlock(String blockId, Map<String, Object> body) {
        String lessonId = lessonIdForBlock(blockId);
        if (lessonId == null) return null;
        requireLessonOwner(lessonId, str(body.get("teacherId")), str(body.get("teacherEmail")), bool(body.get("admin")));
        return create(null, blockId, body);
    }

    @Transactional
    public Map<String, Object> update(String exerciseId, Map<String, Object> body) {
        Map<String, Object> current = find(exerciseId);
        if (current == null) return null;
        requireExerciseOwner(current, str(body.get("teacherId")), str(body.get("teacherEmail")), bool(body.get("admin")));

        Map<String, Object> merged = new LinkedHashMap<>(current);
        for (String key : List.of("type", "instruction", "question", "explanation", "hint", "score", "orderIndex", "status", "options", "acceptedAnswers", "matchingPairs", "wordTokens", "correctOrder")) {
            if (body.containsKey(key)) merged.put(key, body.get(key));
        }
        validate(merged, false);

        jdbc.update("""
            update "GrammarExercise" set
              "type" = coalesce(?::"GrammarExerciseType", "type"),
              "instruction" = coalesce(?, "instruction"),
              "question" = coalesce(?, "question"),
              "explanation" = coalesce(?, "explanation"),
              "hint" = coalesce(?, "hint"),
              "score" = coalesce(?, "score"),
              "orderIndex" = coalesce(?, "orderIndex"),
              "status" = coalesce(?::"GrammarExerciseStatus", "status"),
              "options" = coalesce(?::jsonb, "options"),
              "acceptedAnswers" = coalesce(?::jsonb, "acceptedAnswers"),
              "matchingPairs" = coalesce(?::jsonb, "matchingPairs"),
              "wordTokens" = coalesce(?::jsonb, "wordTokens"),
              "correctOrder" = coalesce(?::jsonb, "correctOrder"),
              "updatedAt" = current_timestamp
            where "id" = ?
            """,
            typeOrNull(body.get("type")), nullableText(body, "instruction"), nullableRequiredText(body, "question"), nullableText(body, "explanation"), nullableText(body, "hint"),
            nullableInt(body.get("score")), nullableInt(body.get("orderIndex")), statusOrNull(body.get("status")),
            jsonOrNull(body, "options"), jsonOrNull(body, "acceptedAnswers"), jsonOrNull(body, "matchingPairs"), jsonOrNull(body, "wordTokens"), jsonOrNull(body, "correctOrder"), exerciseId);
        return find(exerciseId);
    }

    @Transactional
    public boolean delete(String exerciseId, String teacherId, String teacherEmail, boolean admin) {
        Map<String, Object> current = find(exerciseId);
        if (current == null) return false;
        requireExerciseOwner(current, teacherId, teacherEmail, admin);
        return jdbc.update("delete from \"GrammarExercise\" where \"id\" = ?", exerciseId) > 0;
    }

    private Map<String, Object> create(String lessonId, String blockId, Map<String, Object> body) {
        Map<String, Object> candidate = new LinkedHashMap<>();
        candidate.put("lessonId", lessonId);
        candidate.put("lessonBlockId", blockId);
        candidate.put("type", body.get("type"));
        candidate.put("instruction", body.get("instruction"));
        candidate.put("question", body.get("question"));
        candidate.put("explanation", body.get("explanation"));
        candidate.put("hint", body.get("hint"));
        candidate.put("score", body.get("score"));
        candidate.put("orderIndex", body.get("orderIndex"));
        candidate.put("status", body.get("status"));
        candidate.put("options", body.get("options"));
        candidate.put("acceptedAnswers", body.get("acceptedAnswers"));
        candidate.put("matchingPairs", body.get("matchingPairs"));
        candidate.put("wordTokens", body.get("wordTokens"));
        candidate.put("correctOrder", body.get("correctOrder"));
        validate(candidate, true);

        String id = UUID.randomUUID().toString();
        String type = type(candidate.get("type"));
        jdbc.update("""
            insert into "GrammarExercise" (
              "id", "lessonId", "lessonBlockId", "type", "instruction", "question", "explanation", "hint", "score", "orderIndex", "status",
              "options", "acceptedAnswers", "matchingPairs", "wordTokens", "correctOrder", "createdAt", "updatedAt"
            ) values (?, ?, ?, ?::"GrammarExerciseType", ?, ?, ?, ?, ?, ?, ?::"GrammarExerciseStatus", ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, current_timestamp, current_timestamp)
            """,
            id, lessonId, blockId, type, str(candidate.get("instruction")), text(str(candidate.get("question")), ""), str(candidate.get("explanation")), str(candidate.get("hint")),
            intVal(candidate.get("score"), 1), intVal(candidate.get("orderIndex"), nextOrder(lessonId, blockId)), status(candidate.get("status")),
            json(candidate.get("options")), json(candidate.get("acceptedAnswers")), json(candidate.get("matchingPairs")), json(candidate.get("wordTokens")), json(candidate.get("correctOrder")));
        return find(id);
    }

    private void validate(Map<String, Object> data, boolean create) {
        String type = type(data.get("type"));
        String question = str(data.get("question"));
        if (create && (question == null || question.isBlank())) throw new IllegalStateException("Grammar exercise question is required");
        Integer score = nullableInt(data.get("score"));
        if (score != null && score < 0) throw new IllegalStateException("Grammar exercise score must be greater than or equal to 0");
        if (!"PUBLISHED".equals(status(data.get("status")))) return;
        switch (type) {
            case "SINGLE_CHOICE" -> validateSingleChoice(data.get("options"));
            case "FILL_BLANK" -> validateFillBlank(question, data.get("acceptedAnswers"));
            case "ERROR_CORRECTION" -> validateErrorCorrection(question, data.get("acceptedAnswers"));
            case "SHORT_SENTENCE" -> validateShortSentence(data.get("acceptedAnswers"));
            case "REORDER_WORDS" -> {
                List<?> tokens = requireArray(data.get("wordTokens"), "wordTokens");
                List<?> order = requireArray(data.get("correctOrder"), "correctOrder");
                if (tokens.size() != order.size()) throw new IllegalStateException("correctOrder must have the same length as wordTokens");
            }
            case "MATCHING" -> validateMatching(data.get("matchingPairs"));
            default -> throw new IllegalStateException("Unsupported grammar exercise type");
        }
    }


    private void validateFillBlank(String question, Object value) {
        int blankCount = blankCount(question);
        if (blankCount < 1) throw new IllegalStateException("FILL_BLANK requires at least one {{blank}} placeholder");
        List<?> blanks = requireArray(value, "acceptedAnswers");
        if (blanks.size() != blankCount) throw new IllegalStateException("acceptedAnswers must match the number of {{blank}} placeholders");
        for (Object blank : blanks) {
            if (!(blank instanceof Map<?, ?> map)) throw new IllegalStateException("Each blank config must be an object");
            Object answers = map.get("answers");
            if (!(answers instanceof List<?> list) || list.stream().noneMatch(answer -> answer != null && !String.valueOf(answer).isBlank())) {
                throw new IllegalStateException("Each blank requires at least one accepted answer");
            }
        }
    }

    private int blankCount(String question) {
        if (question == null || question.isBlank()) return 0;
        int count = 0;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\{\\{blank\\}\\}").matcher(question);
        while (matcher.find()) count++;
        return count;
    }
    private void validateSingleChoice(Object value) {
        List<?> options = requireArray(value, "options");
        if (options.size() < 2) throw new IllegalStateException("SINGLE_CHOICE requires at least two options");
        if (options.size() > 6) throw new IllegalStateException("SINGLE_CHOICE supports at most six options");
        int correct = 0;
        for (Object option : options) {
            if (!(option instanceof Map<?, ?> map)) throw new IllegalStateException("Each SINGLE_CHOICE option must be an object");
            Object content = map.get("content");
            if (content == null || String.valueOf(content).isBlank()) throw new IllegalStateException("Each SINGLE_CHOICE option requires content");
            if (Boolean.TRUE.equals(map.get("isCorrect"))) correct++;
        }
        if (correct != 1) throw new IllegalStateException("SINGLE_CHOICE requires exactly one correct option");
    }




    private void validateShortSentence(Object value) {
        List<?> configs = requireArray(value, "acceptedAnswers");
        Object first = configs.get(0);
        if (!(first instanceof Map<?, ?> map)) throw new IllegalStateException("SHORT_SENTENCE config must be an object");
        String gradingMode = str(map.get("gradingMode"));
        if (!"AUTO_EXACT".equals(gradingMode) && !"MANUAL".equals(gradingMode)) throw new IllegalStateException("SHORT_SENTENCE gradingMode must be AUTO_EXACT or MANUAL");
        Object answers = map.get("acceptedAnswers");
        if ("AUTO_EXACT".equals(gradingMode) && (!(answers instanceof List<?> list) || list.stream().noneMatch(answer -> answer != null && !String.valueOf(answer).isBlank()))) {
            throw new IllegalStateException("AUTO_EXACT requires at least one accepted answer");
        }
    }    private void validateErrorCorrection(String question, Object value) {
        List<?> configs = requireArray(value, "acceptedAnswers");
        Object first = configs.get(0);
        if (!(first instanceof Map<?, ?> map)) throw new IllegalStateException("ERROR_CORRECTION config must be an object");
        String errorText = str(map.get("errorText"));
        if (errorText == null || errorText.isBlank()) throw new IllegalStateException("ERROR_CORRECTION requires errorText");
        if (question == null || !question.contains(errorText)) throw new IllegalStateException("errorText must exist in the wrong sentence");
        Object answers = map.get("answers");
        if (!(answers instanceof List<?> list) || list.stream().noneMatch(answer -> answer != null && !String.valueOf(answer).isBlank())) {
            throw new IllegalStateException("ERROR_CORRECTION requires at least one accepted answer");
        }
    }
    private void validateMatching(Object value) {
        List<?> pairs = requireArray(value, "matchingPairs");
        if (pairs.size() < 2) throw new IllegalStateException("MATCHING requires at least two pairs");
        if (pairs.size() > 10) throw new IllegalStateException("MATCHING supports at most ten pairs");
        java.util.Set<String> ids = new java.util.HashSet<>();
        for (Object pair : pairs) {
            if (!(pair instanceof Map<?, ?> map)) throw new IllegalStateException("Each MATCHING pair must be an object");
            String id = str(map.get("id"));
            String left = str(map.get("left"));
            String right = str(map.get("right"));
            if (id == null || id.isBlank()) throw new IllegalStateException("Each MATCHING pair requires an id");
            if (!ids.add(id)) throw new IllegalStateException("MATCHING pair ids must be unique");
            if (left == null || left.isBlank() || right == null || right.isBlank()) throw new IllegalStateException("Each MATCHING pair requires left and right content");
        }
    }
    private List<?> requireArray(Object value, String field) {
        if (!(value instanceof List<?> list) || list.isEmpty()) throw new IllegalStateException(field + " is required for this grammar exercise type");
        return list;
    }

    private void requireExerciseOwner(Map<String, Object> exercise, String teacherId, String teacherEmail, boolean admin) {
        String lessonId = str(exercise.get("lessonId"));
        if (lessonId == null || lessonId.isBlank()) lessonId = lessonIdForBlock(str(exercise.get("lessonBlockId")));
        requireLessonOwner(lessonId, teacherId, teacherEmail, admin);
    }

    private void requireLessonOwner(String lessonId, String teacherId, String teacherEmail, boolean admin) {
        if (lessonId == null || lessonId.isBlank()) throw new IllegalStateException("Foundation lesson not found");
        if (admin) return;
        if ((teacherId == null || teacherId.isBlank()) && (teacherEmail == null || teacherEmail.isBlank())) {
            throw new IllegalStateException("Teacher identity is required");
        }
        List<Integer> rows = jdbc.queryForList("""
            select 1
            from "FoundationLesson" l
            join "FoundationUnit" u on u."id" = l."unitId"
            join "FoundationCourse" c on c."id" = u."courseId"
            join "User" owner on owner."id" = c."teacherId"
            where l."id" = ? and (c."teacherId" = ? or owner."email" = ?)
            limit 1
            """, Integer.class, lessonId, blankToImpossible(teacherId), blankToImpossible(teacherEmail));
        if (rows.isEmpty()) throw new IllegalStateException("Only the teacher who owns this lesson can manage grammar exercises");
    }

    private Map<String, Object> find(String id) {
        List<Map<String, Object>> rows = jdbc.query("select * from \"GrammarExercise\" where \"id\" = ?", (rs, i) -> exerciseRow(rs), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> exerciseRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("lessonId", rs.getString("lessonId"));
        row.put("lessonBlockId", rs.getString("lessonBlockId"));
        row.put("type", rs.getString("type"));
        row.put("instruction", rs.getString("instruction"));
        row.put("question", rs.getString("question"));
        row.put("explanation", rs.getString("explanation"));
        row.put("hint", rs.getString("hint"));
        row.put("score", rs.getInt("score"));
        row.put("orderIndex", rs.getInt("orderIndex"));
        row.put("status", rs.getString("status"));
        row.put("options", parseJson(rs.getString("options")));
        row.put("acceptedAnswers", parseJson(rs.getString("acceptedAnswers")));
        row.put("matchingPairs", parseJson(rs.getString("matchingPairs")));
        row.put("wordTokens", parseJson(rs.getString("wordTokens")));
        row.put("correctOrder", parseJson(rs.getString("correctOrder")));
        row.put("createdAt", iso(rs.getTimestamp("createdAt")));
        row.put("updatedAt", iso(rs.getTimestamp("updatedAt")));
        return row;
    }

    private Object parseJson(String value) {
        try {
            return objectMapper.readValue(value == null ? "[]" : value, new TypeReference<Object>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String lessonIdForBlock(String blockId) {
        if (blockId == null || blockId.isBlank()) return null;
        List<String> rows = jdbc.queryForList("select \"lessonId\" from \"FoundationLessonBlock\" where \"id\" = ?", String.class, blockId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private int nextOrder(String lessonId, String blockId) {
        String column = lessonId != null ? "lessonId" : "lessonBlockId";
        String value = lessonId != null ? lessonId : blockId;
        Integer order = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"GrammarExercise\" where \"" + column + "\" = ?", Integer.class, value);
        return order == null ? 0 : order;
    }

    private String type(Object value) {
        String type = str(value);
        if (type == null || type.isBlank()) throw new IllegalStateException("Grammar exercise type is required");
        type = type.toUpperCase();
        if (!TYPES.contains(type)) throw new IllegalStateException("Unsupported grammar exercise type");
        return type;
    }

    private String typeOrNull(Object value) { return value == null ? null : type(value); }
    private String status(Object value) { String v = str(value); if (v == null || v.isBlank()) return "DRAFT"; return statusOrNull(v); }
    private String statusOrNull(Object value) {
        if (value == null) return null;
        String v = String.valueOf(value).toUpperCase();
        if (v.equals("DRAFT") || v.equals("PUBLISHED")) return v;
        throw new IllegalStateException("Grammar exercise status must be DRAFT or PUBLISHED");
    }
    private String json(Object value) { try { return objectMapper.writeValueAsString(value == null ? List.of() : value); } catch (Exception ex) { throw new IllegalStateException("Invalid grammar exercise JSON field"); } }
    private String jsonOrNull(Map<String, Object> body, String key) { return body.containsKey(key) ? json(body.get(key)) : null; }
    private String nullableText(Map<String, Object> body, String key) { return body.containsKey(key) ? str(body.get(key)) : null; }
    private String nullableRequiredText(Map<String, Object> body, String key) { return body.containsKey(key) ? text(str(body.get(key)), "") : null; }
    private String str(Object value) { return value == null ? null : String.valueOf(value); }
    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private String blankToImpossible(String value) { return value == null || value.isBlank() ? "__missing__" : value; }
    private boolean bool(Object value) { return value != null && Boolean.parseBoolean(String.valueOf(value)); }
    private int intVal(Object value, int fallback) { Integer parsed = nullableInt(value); return parsed == null ? fallback : parsed; }
    private Integer nullableInt(Object value) { if (value == null || String.valueOf(value).isBlank()) return null; try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException ex) { throw new IllegalStateException("Numeric fields must be valid integers"); } }
    private String iso(Timestamp value) { return value == null ? null : value.toInstant().toString(); }
}