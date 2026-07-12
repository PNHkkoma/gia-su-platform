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
public class GrammarMiniQuizService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final FoundationCourseService foundationCourseService;

    public GrammarMiniQuizService(JdbcTemplate jdbc, ObjectMapper objectMapper, FoundationCourseService foundationCourseService) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.foundationCourseService = foundationCourseService;
    }

    public Map<String, Object> teacherQuiz(String blockId, String teacherId, String teacherEmail, boolean admin) {
        String lessonId = lessonIdForBlock(blockId);
        requireLessonOwner(lessonId, teacherId, teacherEmail, admin);
        return quizByBlock(blockId, false);
    }

    @Transactional
    public Map<String, Object> saveTeacherQuiz(String blockId, Map<String, Object> body) {
        String lessonId = lessonIdForBlock(blockId);
        requireLessonOwner(lessonId, str(body.get("teacherId")), str(body.get("teacherEmail")), bool(body.get("admin")));
        String quizId = ensureQuiz(blockId);
        String title = text(str(body.get("title")), "Grammar mini quiz");
        double passScore = doubleVal(body.get("passScore"), 70);
        int maxAttempts = Math.max(1, intVal(body.get("maxAttempts"), 1));
        String show = showMode(str(body.get("showExplanationMode")));
        String status = "PUBLISHED".equals(str(body.get("status"))) ? "PUBLISHED" : "DRAFT";
        List<String> exerciseIds = stringList(body.get("exerciseIds"));
        if ("PUBLISHED".equals(status) && exerciseIds.isEmpty()) throw new IllegalStateException("Mini quiz needs at least one exercise before publish");
        jdbc.update("update \"GrammarMiniQuiz\" set \"title\"=?, \"passScore\"=?, \"maxAttempts\"=?, \"showExplanationMode\"=?, \"status\"=?, \"updatedAt\"=current_timestamp where \"id\"=?", title, passScore, maxAttempts, show, status, quizId);
        jdbc.update("delete from \"GrammarMiniQuizItem\" where \"quizId\"=?", quizId);
        for (int i = 0; i < exerciseIds.size(); i++) {
            String exerciseId = exerciseIds.get(i);
            if (!exerciseInBlock(exerciseId, blockId)) throw new IllegalStateException("Exercise does not belong to this grammar block");
            jdbc.update("insert into \"GrammarMiniQuizItem\" (\"id\", \"quizId\", \"exerciseId\", \"orderIndex\", \"createdAt\", \"updatedAt\") values (?, ?, ?, ?, current_timestamp, current_timestamp)", UUID.randomUUID().toString(), quizId, exerciseId, i);
        }
        return quizByBlock(blockId, false);
    }

    public Map<String, Object> studentQuiz(String blockId, String studentId, String studentEmail) {
        String sid = studentId(studentId, studentEmail);
        Map<String, Object> quiz = quizByBlock(blockId, true);
        if (quiz != null) quiz.put("remainingAttempts", remainingAttempts(str(quiz.get("id")), sid, intVal(quiz.get("maxAttempts"), 1)));
        return quiz;
    }

    @Transactional
    public Map<String, Object> start(String quizId, Map<String, Object> body) {
        String sid = studentId(str(body.get("studentId")), str(body.get("studentEmail")));
        Map<String, Object> quiz = quizById(quizId, true);
        if (quiz == null) return null;
        int maxAttempts = intVal(quiz.get("maxAttempts"), 1);
        int used = submittedAttempts(quizId, sid);
        if (used >= maxAttempts) throw new IllegalStateException("No attempts left for this mini quiz");
        List<Map<String, Object>> active = jdbc.query("select * from \"QuizAttempt\" where \"quizId\"=? and \"studentId\"=? and \"status\"='IN_PROGRESS' order by \"startedAt\" desc limit 1", (rs, i) -> attemptRow(rs), quizId, sid);
        if (!active.isEmpty()) return active.get(0);
        String id = UUID.randomUUID().toString();
        jdbc.update("insert into \"QuizAttempt\" (\"id\", \"studentId\", \"quizId\", \"attemptNumber\", \"answers\", \"status\", \"startedAt\", \"createdAt\", \"updatedAt\") values (?, ?, ?, ?, '{}'::jsonb, 'IN_PROGRESS', current_timestamp, current_timestamp, current_timestamp)", id, sid, quizId, used + 1);
        return attempt(id);
    }

    @Transactional
    public Map<String, Object> autosave(String attemptId, Map<String, Object> body) {
        Map<String, Object> current = attempt(attemptId);
        if (current == null || !"IN_PROGRESS".equals(current.get("status"))) return current;
        jdbc.update("update \"QuizAttempt\" set \"answers\"=?::jsonb, \"updatedAt\"=current_timestamp where \"id\"=?", json(body.get("answers")), attemptId);
        return attempt(attemptId);
    }

    @Transactional
    public Map<String, Object> submit(String attemptId, Map<String, Object> body) {
        Map<String, Object> current = attempt(attemptId);
        if (current == null) return null;
        if (!"IN_PROGRESS".equals(current.get("status"))) return current;
        String quizId = str(current.get("quizId"));
        String studentId = str(current.get("studentId"));
        Map<String, Object> quiz = quizById(quizId, true);
        Map<String, Object> answers = objectMap(body.containsKey("answers") ? body.get("answers") : current.get("answers"));
        List<Map<String, Object>> items = items(quizId, true);
        double total = 0;
        double max = 0;
        int correct = 0;
        int incorrect = 0;
        int unanswered = 0;
        List<Map<String, Object>> review = new ArrayList<>();
        for (Map<String, Object> item : items) {
            Map<String, Object> exercise = objectMap(item.get("exercise"));
            String exerciseId = str(exercise.get("id"));
            max += doubleVal(exercise.get("score"), 0);
            Map<String, Object> answer = objectMap(answers.get(exerciseId));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("exerciseId", exerciseId);
            row.put("question", exercise.get("question"));
            row.put("type", exercise.get("type"));
            if (answer.isEmpty()) {
                unanswered++;
                row.put("status", "UNANSWERED");
                row.put("score", 0);
                row.put("maxScore", exercise.get("score"));
            } else {
                answer.put("studentId", studentId);
                Map<String, Object> result = foundationCourseService.submitSingleChoiceExercise(exerciseId, answer);
                if (result != null && result.get("id") != null) jdbc.update("update \"ExerciseAttempt\" set \"quizAttemptId\"=? where \"id\"=?", attemptId, result.get("id"));
                double score = doubleVal(result == null ? null : result.get("score"), 0);
                total += score;
                boolean isCorrect = Boolean.TRUE.equals(result == null ? null : result.get("isCorrect"));
                if (isCorrect) correct++; else incorrect++;
                row.put("status", result == null ? "INCORRECT" : result.get("status"));
                row.put("score", score);
                row.put("maxScore", result == null ? exercise.get("score") : result.get("maxScore"));
                row.put("result", result);
            }
            row.put("exercise", exercise);
            review.add(row);
        }
        double percentage = max <= 0 ? 0 : (total * 100.0 / max);
        boolean passed = percentage >= doubleVal(quiz.get("passScore"), 70);
        jdbc.update("update \"QuizAttempt\" set \"answers\"=?::jsonb, \"score\"=?, \"maxScore\"=?, \"correctCount\"=?, \"incorrectCount\"=?, \"unansweredCount\"=?, \"percentage\"=?, \"passed\"=?, \"status\"='SUBMITTED', \"submittedAt\"=current_timestamp, \"updatedAt\"=current_timestamp where \"id\"=?", json(answers), total, max, correct, incorrect, unanswered, percentage, passed, attemptId);
        Map<String, Object> result = attempt(attemptId);
        result.put("review", review);
        result.put("canRetry", submittedAttempts(quizId, studentId) < intVal(quiz.get("maxAttempts"), 1));
        return result;
    }


    public Map<String, Object> teacherProgress(String blockId, String teacherId, String teacherEmail, boolean admin) {
        String lessonId = lessonIdForBlock(blockId);
        requireLessonOwner(lessonId, teacherId, teacherEmail, admin);
        Map<String, Object> payload = new LinkedHashMap<>();
        Map<String, Object> quiz = quizByBlock(blockId, false);
        payload.put("quiz", quiz);
        List<Map<String, Object>> attempts = new ArrayList<>();
        if (quiz != null) {
            attempts = jdbc.query("""
                select qa.*, u."fullName", u."email"
                from "QuizAttempt" qa join "User" u on u."id" = qa."studentId"
                where qa."quizId" = ?
                order by qa."updatedAt" desc
                """, (rs, i) -> {
                Map<String, Object> row = attemptRow(rs);
                row.put("studentName", rs.getString("fullName"));
                row.put("studentEmail", rs.getString("email"));
                row.put("completionPercentage", row.get("percentage"));
                row.put("pendingManualGrading", pendingManualCount(rs.getString("id")) > 0);
                row.put("details", attemptDetails(rs.getString("id")));
                return row;
            }, quiz.get("id"));
        }
        payload.put("attempts", attempts);
        payload.put("standaloneAttempts", standaloneAttempts(blockId));
        return payload;
    }

    private int pendingManualCount(String quizAttemptId) {
        Integer v = jdbc.queryForObject("select count(*) from \"ExerciseAttempt\" where \"quizAttemptId\"=? and \"status\"='PENDING_GRADING'", Integer.class, quizAttemptId);
        return v == null ? 0 : v;
    }

    private List<Map<String, Object>> attemptDetails(String quizAttemptId) {
        return jdbc.query("""
            select ea.*, ge."type", ge."question", ge."explanation"
            from "ExerciseAttempt" ea join "GrammarExercise" ge on ge."id" = ea."exerciseId"
            where ea."quizAttemptId" = ?
            order by ea."createdAt" asc
            """, (rs, i) -> exerciseAttemptRow(rs), quizAttemptId);
    }

    private List<Map<String, Object>> standaloneAttempts(String blockId) {
        return jdbc.query("""
            select ea.*, ge."type", ge."question", ge."explanation", u."fullName", u."email"
            from "ExerciseAttempt" ea
            join "GrammarExercise" ge on ge."id" = ea."exerciseId"
            join "User" u on u."id" = ea."studentId"
            where ge."lessonBlockId" = ? and ea."quizAttemptId" is null
            order by ea."updatedAt" desc
            """, (rs, i) -> {
            Map<String, Object> row = exerciseAttemptRow(rs);
            row.put("studentName", rs.getString("fullName"));
            row.put("studentEmail", rs.getString("email"));
            row.put("completionPercentage", doubleVal(row.get("maxScore"), 0) <= 0 ? 0 : (doubleVal(row.get("score"), 0) * 100.0 / doubleVal(row.get("maxScore"), 1)));
            row.put("correctCount", Boolean.TRUE.equals(row.get("isCorrect")) ? 1 : 0);
            row.put("incorrectCount", Boolean.TRUE.equals(row.get("isCorrect")) ? 0 : 1);
            row.put("pendingManualGrading", "PENDING_GRADING".equals(row.get("status")));
            return row;
        }, blockId);
    }

    private Map<String, Object> exerciseAttemptRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("exerciseId", rs.getString("exerciseId"));
        row.put("type", rs.getString("type"));
        row.put("question", rs.getString("question"));
        row.put("answer", parseObject(rs.getString("answerPayload")));
        row.put("isCorrect", rs.getBoolean("isCorrect"));
        row.put("status", rs.getString("status"));
        row.put("score", rs.getDouble("score"));
        row.put("maxScore", rs.getDouble("maxScore"));
        row.put("submittedAt", iso(rs.getTimestamp("updatedAt")));
        row.put("explanation", rs.getString("explanation"));
        row.put("feedback", null);
        row.put("commonMistake", rs.getBoolean("isCorrect") ? null : "Cần xem lại đáp án và explanation của câu này.");
        return row;
    }
    private String ensureQuiz(String blockId) {
        List<String> ids = jdbc.queryForList("select \"id\" from \"GrammarMiniQuiz\" where \"lessonBlockId\"=?", String.class, blockId);
        if (!ids.isEmpty()) return ids.get(0);
        String id = UUID.randomUUID().toString();
        jdbc.update("insert into \"GrammarMiniQuiz\" (\"id\", \"lessonBlockId\", \"createdAt\", \"updatedAt\") values (?, ?, current_timestamp, current_timestamp)", id, blockId);
        return id;
    }

    private Map<String, Object> quizByBlock(String blockId, boolean publishedOnly) {
        List<Map<String, Object>> rows = jdbc.query("select * from \"GrammarMiniQuiz\" where \"lessonBlockId\"=?" + (publishedOnly ? " and \"status\"='PUBLISHED'" : ""), (rs, i) -> quizRow(rs, publishedOnly), blockId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> quizById(String id, boolean publishedOnly) {
        List<Map<String, Object>> rows = jdbc.query("select * from \"GrammarMiniQuiz\" where \"id\"=?" + (publishedOnly ? " and \"status\"='PUBLISHED'" : ""), (rs, i) -> quizRow(rs, publishedOnly), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> quizRow(java.sql.ResultSet rs, boolean studentSafe) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id")); row.put("lessonBlockId", rs.getString("lessonBlockId")); row.put("title", rs.getString("title"));
        row.put("passScore", rs.getDouble("passScore")); row.put("maxAttempts", rs.getInt("maxAttempts")); row.put("showExplanationMode", rs.getString("showExplanationMode")); row.put("status", rs.getString("status"));
        row.put("items", items(rs.getString("id"), studentSafe));
        return row;
    }

    private List<Map<String, Object>> items(String quizId, boolean studentSafe) {
        return jdbc.query("""
            select qi."id" as "itemId", qi."orderIndex", ge."id", ge."type", ge."instruction", ge."question", ge."explanation", ge."hint", ge."score", ge."options"::text as "optionsJson", ge."wordTokens"::text as "wordTokensJson", ge."matchingPairs"::text as "matchingPairsJson"
            from "GrammarMiniQuizItem" qi join "GrammarExercise" ge on ge."id" = qi."exerciseId"
            where qi."quizId"=? and ge."status"='PUBLISHED'::"GrammarExerciseStatus"
            order by qi."orderIndex" asc, qi."createdAt" asc
            """, (rs, i) -> {
            Map<String, Object> ex = new LinkedHashMap<>();
            String type = rs.getString("type");
            ex.put("id", rs.getString("id")); ex.put("type", type); ex.put("instruction", rs.getString("instruction")); ex.put("question", "REORDER_WORDS".equals(type) ? "Sắp xếp các token thành câu đúng." : rs.getString("question")); ex.put("explanation", rs.getString("explanation")); ex.put("hint", rs.getString("hint")); ex.put("score", rs.getInt("score")); ex.put("orderIndex", rs.getInt("orderIndex"));
            ex.put("options", safeOptions(rs.getString("optionsJson"))); ex.put("wordTokens", parseJsonList(rs.getString("wordTokensJson"))); ex.put("matchingPairs", safeMatchingPairs(rs.getString("matchingPairsJson")));
            Map<String, Object> item = new LinkedHashMap<>(); item.put("id", rs.getString("itemId")); item.put("orderIndex", rs.getInt("orderIndex")); item.put("exercise", ex);
            return item;
        }, quizId);
    }

    private Map<String, Object> attempt(String id) {
        List<Map<String, Object>> rows = jdbc.query("select * from \"QuizAttempt\" where \"id\"=?", (rs, i) -> attemptRow(rs), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> attemptRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id")); row.put("studentId", rs.getString("studentId")); row.put("quizId", rs.getString("quizId")); row.put("attemptNumber", rs.getInt("attemptNumber"));
        row.put("answers", parseObject(rs.getString("answers"))); row.put("score", rs.getDouble("score")); row.put("maxScore", rs.getDouble("maxScore")); row.put("correctCount", rs.getInt("correctCount")); row.put("incorrectCount", rs.getInt("incorrectCount")); row.put("unansweredCount", rs.getInt("unansweredCount")); row.put("percentage", rs.getDouble("percentage")); row.put("passed", rs.getBoolean("passed")); row.put("status", rs.getString("status")); row.put("startedAt", iso(rs.getTimestamp("startedAt"))); row.put("submittedAt", iso(rs.getTimestamp("submittedAt")));
        return row;
    }

    private int submittedAttempts(String quizId, String studentId) { Integer v = jdbc.queryForObject("select count(*) from \"QuizAttempt\" where \"quizId\"=? and \"studentId\"=? and \"status\"='SUBMITTED'", Integer.class, quizId, studentId); return v == null ? 0 : v; }
    private int remainingAttempts(String quizId, String studentId, int maxAttempts) { return Math.max(0, maxAttempts - submittedAttempts(quizId, studentId)); }
    private boolean exerciseInBlock(String exerciseId, String blockId) { List<Integer> rows = jdbc.queryForList("select 1 from \"GrammarExercise\" where \"id\"=? and \"lessonBlockId\"=? limit 1", Integer.class, exerciseId, blockId); return !rows.isEmpty(); }
    private String lessonIdForBlock(String blockId) { List<String> rows = jdbc.queryForList("select \"lessonId\" from \"FoundationLessonBlock\" where \"id\"=?", String.class, blockId); return rows.isEmpty() ? null : rows.get(0); }
    private void requireLessonOwner(String lessonId, String teacherId, String teacherEmail, boolean admin) { if (lessonId == null || lessonId.isBlank()) throw new IllegalStateException("Foundation lesson not found"); if (admin) return; List<Integer> rows = jdbc.queryForList("select 1 from \"FoundationLesson\" l join \"FoundationUnit\" u on u.\"id\"=l.\"unitId\" join \"FoundationCourse\" c on c.\"id\"=u.\"courseId\" join \"User\" owner on owner.\"id\"=c.\"teacherId\" where l.\"id\"=? and (c.\"teacherId\"=? or owner.\"email\"=?) limit 1", Integer.class, lessonId, blank(teacherId), blank(teacherEmail)); if (rows.isEmpty()) throw new IllegalStateException("Only the teacher who owns this lesson can manage mini quiz"); }
    private String studentId(String studentId, String email) { if (studentId != null && !studentId.isBlank()) return studentId; List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\"=? and \"role\"='STUDENT'::\"Role\"", String.class, text(email, "student@example.com")); if (!ids.isEmpty()) return ids.get(0); ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\"='STUDENT'::\"Role\" order by \"createdAt\" limit 1", String.class); if (ids.isEmpty()) throw new IllegalStateException("Student not found"); return ids.get(0); }
    private String showMode(String value) { String v = value == null ? "AFTER_SUBMIT" : value.toUpperCase(); return v.equals("ALWAYS") || v.equals("AFTER_SUBMIT") || v.equals("NEVER") ? v : "AFTER_SUBMIT"; }
    private List<String> stringList(Object value) { if (!(value instanceof List<?> raw)) return List.of(); List<String> out = new ArrayList<>(); for (Object item : raw) if (item != null && !String.valueOf(item).isBlank()) out.add(String.valueOf(item)); return out; }
    private Map<String, Object> objectMap(Object value) { if (value instanceof Map<?, ?> raw) { Map<String, Object> out = new LinkedHashMap<>(); raw.forEach((k, v) -> out.put(String.valueOf(k), v)); return out; } return new LinkedHashMap<>(); }
    private List<?> parseJsonList(String json) { try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<?>>() {}); } catch (Exception ex) { return List.of(); } }
    private Map<String, Object> parseObject(String json) { try { return objectMapper.readValue(json == null ? "{}" : json, new TypeReference<Map<String, Object>>() {}); } catch (Exception ex) { return new LinkedHashMap<>(); } }
    private List<Map<String, Object>> safeOptions(String json) { List<Map<String, Object>> raw = parseObjectList(json); List<Map<String, Object>> result = new ArrayList<>(); for (Map<String, Object> option : raw) { Map<String, Object> clean = new LinkedHashMap<>(); clean.put("id", option.get("id")); clean.put("content", option.get("content")); clean.put("orderIndex", option.get("orderIndex")); result.add(clean); } return result; }
    private List<Map<String, Object>> safeMatchingPairs(String json) { List<Map<String, Object>> raw = parseObjectList(json); List<Map<String, Object>> result = new ArrayList<>(); for (int i = 0; i < raw.size(); i++) { Map<String, Object> pair = raw.get(i); Map<String, Object> clean = new LinkedHashMap<>(); clean.put("id", pair.get("id")); clean.put("left", pair.get("left")); clean.put("right", pair.get("right")); clean.put("orderIndex", pair.getOrDefault("orderIndex", i)); result.add(clean); } return result; }
    private List<Map<String, Object>> parseObjectList(String json) { try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<Map<String, Object>>>() {}); } catch (Exception ex) { return List.of(); } }
    private String json(Object value) { try { return objectMapper.writeValueAsString(value == null ? Map.of() : value); } catch (Exception ex) { throw new IllegalStateException("Invalid JSON payload"); } }
    private String str(Object value) { return value == null ? null : String.valueOf(value); }
    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private boolean bool(Object value) { return value != null && Boolean.parseBoolean(String.valueOf(value)); }
    private int intVal(Object value, int fallback) { if (value == null || String.valueOf(value).isBlank()) return fallback; try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException ex) { return fallback; } }
    private double doubleVal(Object value, double fallback) { if (value == null || String.valueOf(value).isBlank()) return fallback; try { return Double.parseDouble(String.valueOf(value)); } catch (NumberFormatException ex) { return fallback; } }
    private String blank(String value) { return value == null || value.isBlank() ? "__missing__" : value; }
    private String iso(Timestamp value) { return value == null ? null : value.toInstant().toString(); }
}