package com.giasu.service;

import com.giasu.common.Slugs;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TestService {
    private final JdbcTemplate jdbc;

    public TestService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> teacherTests(String teacherId, String teacherEmail, boolean admin) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            select t."id", t."title", t."description", t."slug", t."status"::text as "status",
                   t."durationMinutes", t."maxAttempts", t."createdAt", u."fullName" as "teacherName",
                   count(distinct tq."id") as "questionCount", count(distinct a."id") as "attemptCount"
            from "Test" t
            join "User" u on u."id" = t."teacherId"
            left join "TestQuestion" tq on tq."testId" = t."id"
            left join "Attempt" a on a."testId" = t."id"
            where 1 = 1
            """);
        if (!admin) {
            if (teacherId != null && !teacherId.isBlank()) {
                sql.append(" and t.\"teacherId\" = ?");
                args.add(teacherId);
            } else if (teacherEmail != null && !teacherEmail.isBlank()) {
                sql.append(" and u.\"email\" = ?");
                args.add(teacherEmail);
            }
        }
        sql.append(" group by t.\"id\", u.\"fullName\" order by t.\"createdAt\" desc");
        return jdbc.query(sql.toString(), (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("title", rs.getString("title"));
            row.put("description", rs.getString("description"));
            row.put("slug", rs.getString("slug"));
            row.put("status", rs.getString("status"));
            row.put("durationMinutes", rs.getObject("durationMinutes"));
            row.put("maxAttempts", rs.getInt("maxAttempts"));
            row.put("teacherName", rs.getString("teacherName"));
            row.put("questionCount", rs.getInt("questionCount"));
            row.put("attemptCount", rs.getInt("attemptCount"));
            row.put("createdAt", iso(rs.getTimestamp("createdAt")));
            return row;
        }, args.toArray());
    }

    public List<Map<String, Object>> studentTests() {
        List<Map<String, Object>> tests = jdbc.query("""
            select t."id", t."title", t."description", t."slug", t."durationMinutes", t."maxAttempts",
                   t."createdAt", u."fullName" as "teacherName",
                   count(distinct tq."id") as "questionCount",
                   coalesce(sum(coalesce(tq."pointsOverride", q."points")), 0) as "maxScore"
            from "Test" t
            join "User" u on u."id" = t."teacherId"
            left join "TestQuestion" tq on tq."testId" = t."id"
            left join "Question" q on q."id" = tq."questionId"
            where t."status" = 'PUBLISHED'::"TestStatus"
            group by t."id", u."fullName"
            order by t."createdAt" desc
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("slug"));
            row.put("databaseId", rs.getString("id"));
            row.put("title", rs.getString("title"));
            row.put("description", text(rs.getString("description"), "BÃ i kiá»ƒm tra Ä‘Æ°á»£c giÃ¡o viÃªn Ä‘Äƒng cho há»c sinh lÃ m."));
            row.put("group", "BÃ i kiá»ƒm tra chung");
            row.put("teacher", rs.getString("teacherName"));
            row.put("durationMinutes", value(rs.getObject("durationMinutes"), 40));
            row.put("totalPoints", rs.getInt("maxScore"));
            row.put("deadline", rs.getTimestamp("createdAt").toInstant().plus(7, ChronoUnit.DAYS).toString());
            row.put("status", "Not started");
            row.put("isLocked", false);
            row.put("canReview", true);
            row.put("attemptsLeft", Math.max(1, rs.getInt("maxAttempts")));
            row.put("assignedAt", iso(rs.getTimestamp("createdAt")));
            row.put("progress", 0);
            row.put("questionCount", rs.getInt("questionCount"));
            row.put("maxScore", rs.getInt("maxScore"));
            return row;
        });
        tests.forEach(test -> test.put("questions", questionsForSlug(String.valueOf(test.get("id")), true)));
        return tests;
    }

    public Map<String, Object> studentTest(String slug) {
        return studentTests().stream().filter(test -> slug.equals(test.get("id"))).findFirst().orElse(null);
    }

    @Transactional
    public Map<String, Object> createTest(Map<String, Object> body) {
        String teacherId = teacherId(str(body.get("teacherId")), str(body.get("teacherEmail")));
        String id = UUID.randomUUID().toString();
        String title = text(str(body.get("title")), "BÃ i kiá»ƒm tra má»›i");
        String slug = uniqueSlug(title);
        jdbc.update("""
            insert into "Test" ("id", "teacherId", "title", "description", "slug", "status",
                                "durationMinutes", "maxAttempts", "showResultMode", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?::"TestStatus", ?, ?, 'IMMEDIATE'::"ShowResultMode", current_timestamp, current_timestamp)
            """, id, teacherId, title, str(body.get("description")), slug,
            enumText(str(body.get("status")), "DRAFT"), intVal(body.get("durationMinutes"), 40), intVal(body.get("maxAttempts"), 1));
        List<Map<String, Object>> questions = bodyList(body.get("questions"));
        for (int i = 0; i < questions.size(); i++) {
            attachQuestion(id, teacherId, questions.get(i), i);
        }
        return teacherTest(slug);
    }

    @Transactional
    public Map<String, Object> updateTest(String slug, Map<String, Object> body) {
        String id = testId(slug);
        if (id == null) return null;
        jdbc.update("""
            update "Test"
            set "title" = coalesce(?, "title"),
                "description" = coalesce(?, "description"),
                "status" = coalesce(?::"TestStatus", "status"),
                "durationMinutes" = coalesce(?, "durationMinutes"),
                "maxAttempts" = coalesce(?, "maxAttempts"),
                "updatedAt" = current_timestamp
            where "id" = ?
            """, blankToNull(str(body.get("title"))), str(body.get("description")),
            blankToNull(enumText(str(body.get("status")), null)), nullableInt(body.get("durationMinutes")),
            nullableInt(body.get("maxAttempts")), id);
        if (body.containsKey("questions")) {
            jdbc.update("delete from \"TestQuestion\" where \"testId\" = ?", id);
            String teacherId = jdbc.queryForObject("select \"teacherId\" from \"Test\" where \"id\" = ?", String.class, id);
            List<Map<String, Object>> questions = bodyList(body.get("questions"));
            for (int i = 0; i < questions.size(); i++) {
                attachQuestion(id, teacherId, questions.get(i), i);
            }
        }
        return teacherTest(slug);
    }

    @Transactional
    public boolean deleteTest(String slug) {
        String id = testId(slug);
        if (id == null) return false;
        jdbc.update("delete from \"AttemptAnswer\" where \"attemptId\" in (select \"id\" from \"Attempt\" where \"testId\" = ?)", id);
        jdbc.update("delete from \"Attempt\" where \"testId\" = ?", id);
        jdbc.update("delete from \"TestAssignment\" where \"testId\" = ?", id);
        jdbc.update("delete from \"TestQuestion\" where \"testId\" = ?", id);
        jdbc.update("delete from \"Test\" where \"id\" = ?", id);
        return true;
    }

    public Map<String, Object> dashboard(String teacherId, String teacherEmail, boolean admin) {
        String resolved = admin ? null : nullableTeacherId(teacherId, teacherEmail);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("classCount", count(resolved == null ? "select count(*) from \"Class\"" : "select count(*) from \"Class\" where \"teacherId\" = ?", resolved));
        row.put("studentCount", count(resolved == null ? "select count(*) from \"ClassStudent\"" : "select count(*) from \"ClassStudent\" cs join \"Class\" c on c.\"id\" = cs.\"classId\" where c.\"teacherId\" = ?", resolved));
        row.put("openTestCount", count(resolved == null ? "select count(*) from \"Test\"" : "select count(*) from \"Test\" where \"teacherId\" = ?", resolved));
        row.put("tests", teacherTests(resolved, null, resolved == null));
        return row;
    }

    public List<Map<String, Object>> classes(String teacherId, String teacherEmail, boolean admin) {
        String resolved = admin ? null : nullableTeacherId(teacherId, teacherEmail);
        String where = resolved == null ? "" : " where c.\"teacherId\" = ?";
        Object[] args = resolved == null ? new Object[]{} : new Object[]{resolved};
        return jdbc.query("""
            select c."id", c."name", c."description", c."subject", c."level", c."inviteCode", c."status",
                   count(cs."id") as "studentCount"
            from "Class" c left join "ClassStudent" cs on cs."classId" = c."id"
            """ + where + " group by c.\"id\" order by c.\"createdAt\" desc", (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("name", rs.getString("name"));
            row.put("description", rs.getString("description"));
            row.put("subject", rs.getString("subject"));
            row.put("level", rs.getString("level"));
            row.put("inviteCode", rs.getString("inviteCode"));
            row.put("status", rs.getString("status"));
            row.put("studentCount", rs.getInt("studentCount"));
            return row;
        }, args);
    }

    @Transactional
    public Map<String, Object> createClass(Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        String invite = "GS" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        jdbc.update("""
            insert into "Class" ("id", "teacherId", "name", "description", "subject", "level", "inviteCode", "status", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', current_timestamp, current_timestamp)
            """, id, teacherId(str(body.get("teacherId")), str(body.get("teacherEmail"))),
            text(str(body.get("name")), "Lá»›p má»›i"), str(body.get("description")),
            text(str(body.get("subject")), "Chung"), text(str(body.get("level")), "Chung"), invite);
        return jdbc.queryForMap("select * from \"Class\" where \"id\" = ?", id);
    }

    public List<Map<String, Object>> questions(String teacherId, String teacherEmail, boolean admin) {
        String resolved = admin ? null : nullableTeacherId(teacherId, teacherEmail);
        String where = resolved == null ? "" : " where q.\"ownerTeacherId\" = ?";
        Object[] args = resolved == null ? new Object[]{} : new Object[]{resolved};
        return jdbc.query("""
            select q."id", q."type"::text as "type", q."content", q."explanation", q."subject", q."topic",
                   q."difficulty"::text as "difficulty", q."points"
            from "Question" q
            """ + where + " order by q.\"createdAt\" desc", (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("type", rs.getString("type"));
            row.put("content", rs.getString("content"));
            row.put("explanation", rs.getString("explanation"));
            row.put("subject", rs.getString("subject"));
            row.put("topic", rs.getString("topic"));
            row.put("difficulty", rs.getString("difficulty"));
            row.put("points", rs.getInt("points"));
            row.put("options", options(rs.getString("id"), true));
            return row;
        }, args);
    }

    @Transactional
    public Map<String, Object> createQuestion(Map<String, Object> body) {
        String id = insertQuestion(teacherId(str(body.get("teacherId")), str(body.get("teacherEmail"))), body);
        return jdbc.queryForMap("select * from \"Question\" where \"id\" = ?", id);
    }

    @Transactional
    public Map<String, Object> start(String slug, String studentId, String studentEmail) {
        String testId = testId(slug);
        if (testId == null) return null;
        String attemptId = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "Attempt" ("id", "testId", "studentId", "status", "startedAt", "maxScore", "totalQuestions")
            values (?, ?, ?, 'IN_PROGRESS'::"AttemptStatus", current_timestamp, ?, ?)
            """, attemptId, testId, studentId(studentId, studentEmail), maxScore(testId), questionCount(testId));
        return Map.of("attemptId", attemptId, "testId", slug, "status", "IN_PROGRESS");
    }

    @Transactional
    public Map<String, Object> submit(String slug, Map<String, Object> body) {
        String testId = testId(slug);
        if (testId == null) return null;
        String attemptId = text(str(body.get("attemptId")), UUID.randomUUID().toString());
        String studentId = studentId(str(body.get("studentId")), str(body.get("studentEmail")));
        jdbc.update("""
            insert into "Attempt" ("id", "testId", "studentId", "status", "startedAt", "submittedAt", "maxScore", "totalQuestions")
            values (?, ?, ?, 'SUBMITTED'::"AttemptStatus", current_timestamp, current_timestamp, ?, ?)
            on conflict ("id") do update set "status" = 'SUBMITTED'::"AttemptStatus", "submittedAt" = current_timestamp
            """, attemptId, testId, studentId, maxScore(testId), questionCount(testId));
        Map<String, Object> answers = objectMap(body.get("answers"));
        int correctCount = 0;
        double score = 0;
        List<Map<String, Object>> details = new ArrayList<>();
        for (Map<String, Object> question : questionsForSlug(slug, false)) {
            String questionId = String.valueOf(question.get("id"));
            Object answer = answers.get(questionId);
            List<String> correct = options(questionId, true).stream()
                .filter(option -> Boolean.TRUE.equals(option.get("isCorrect")))
                .map(option -> String.valueOf(option.get("content")))
                .toList();
            boolean ok = isCorrect(answer, correct);
            int points = intVal(question.get("points"), 1);
            if (ok) {
                correctCount++;
                score += points;
            }
            jdbc.update("""
                insert into "AttemptAnswer" ("id", "attemptId", "questionId", "selectedOptionIds", "textAnswer", "isCorrect", "score", "updatedAt")
                values (?, ?, ?, ARRAY[]::TEXT[], ?, ?, ?, current_timestamp)
                """, UUID.randomUUID().toString(), attemptId, questionId, answerText(answer), ok, ok ? (double) points : 0.0);
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("questionId", questionId);
            detail.put("selectedAnswer", value(answer, ""));
            detail.put("correctAnswer", correct.size() == 1 ? correct.get(0) : correct);
            detail.put("isCorrect", ok);
            detail.put("explanation", value(question.get("explanation"), ""));
            details.add(detail);
        }
        jdbc.update("update \"Attempt\" set \"correctCount\" = ?, \"score\" = ? where \"id\" = ?", correctCount, score, attemptId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attemptId", attemptId);
        result.put("correctCount", correctCount);
        result.put("totalQuestions", questionCount(testId));
        result.put("score", score);
        result.put("maxScore", maxScore(testId));
        result.put("answers", details);
        return result;
    }

    public Map<String, Object> profile(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList("select \"id\", \"email\", \"fullName\", \"role\"::text as \"role\" from \"User\" where \"email\" = ?", text(email, "student@example.com"));
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    public List<Map<String, Object>> history(String studentId, String studentEmail) {
        return jdbc.query("""
            select a."id", t."title", t."slug", u."fullName" as "teacher", a."submittedAt", a."score", a."maxScore", a."status"::text as "status"
            from "Attempt" a join "Test" t on t."id" = a."testId" join "User" u on u."id" = t."teacherId"
            where a."studentId" = ? and a."submittedAt" is not null
            order by a."submittedAt" desc
            """, (rs, i) -> Map.of(
            "id", rs.getString("slug"),
            "attemptId", rs.getString("id"),
            "title", rs.getString("title"),
            "teacher", rs.getString("teacher"),
            "submittedAt", iso(rs.getTimestamp("submittedAt")),
            "score", value(rs.getObject("score"), 0),
            "maxScore", rs.getInt("maxScore"),
            "status", rs.getString("status")
        ), studentId(studentId, studentEmail));
    }

    public Map<String, Object> teacherTest(String slug) {
        List<Map<String, Object>> rows = teacherTests(null, null, true).stream().filter(row -> slug.equals(row.get("slug"))).toList();
        if (rows.isEmpty()) return null;
        rows.get(0).put("questions", questionsForSlug(slug, false));
        return rows.get(0);
    }

    private List<Map<String, Object>> questionsForSlug(String slug, boolean studentShape) {
        return jdbc.query("""
            select q."id", q."type"::text as "type", q."content", q."explanation", coalesce(tq."pointsOverride", q."points") as "points"
            from "TestQuestion" tq join "Question" q on q."id" = tq."questionId" join "Test" t on t."id" = tq."testId"
            where t."slug" = ? order by tq."orderIndex" asc
            """, (rs, i) -> {
            List<Map<String, Object>> opts = options(rs.getString("id"), true);
            List<String> contents = opts.stream().map(opt -> String.valueOf(opt.get("content"))).toList();
            List<String> correct = opts.stream().filter(opt -> Boolean.TRUE.equals(opt.get("isCorrect"))).map(opt -> String.valueOf(opt.get("content"))).toList();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("type", studentShape ? studentType(rs.getString("type")) : rs.getString("type"));
            row.put("prompt", rs.getString("content"));
            row.put("content", rs.getString("content"));
            row.put("options", contents);
            row.put("correctAnswer", correct.size() == 1 ? correct.get(0) : correct);
            row.put("explanation", rs.getString("explanation"));
            row.put("points", rs.getInt("points"));
            return row;
        }, slug);
    }

    private List<Map<String, Object>> options(String questionId, boolean includeCorrect) {
        return jdbc.query("select \"id\", \"content\", \"isCorrect\", \"orderIndex\" from \"QuestionOption\" where \"questionId\" = ? order by \"orderIndex\"", (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("content", rs.getString("content"));
            if (includeCorrect) row.put("isCorrect", rs.getBoolean("isCorrect"));
            row.put("orderIndex", rs.getInt("orderIndex"));
            return row;
        }, questionId);
    }

    private void attachQuestion(String testId, String teacherId, Map<String, Object> body, int order) {
        String questionId = str(body.get("id"));
        if (questionId == null || questionId.isBlank()) questionId = insertQuestion(teacherId, body);
        jdbc.update("insert into \"TestQuestion\" (\"id\", \"testId\", \"questionId\", \"orderIndex\", \"pointsOverride\") values (?, ?, ?, ?, ?)", UUID.randomUUID().toString(), testId, questionId, order, nullableInt(body.get("points")));
    }

    private String insertQuestion(String teacherId, Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "Question" ("id", "ownerTeacherId", "type", "content", "explanation", "subject", "topic", "difficulty", "points", "createdAt", "updatedAt")
            values (?, ?, ?::"QuestionType", ?, ?, ?, ?, ?::"Difficulty", ?, current_timestamp, current_timestamp)
            """, id, teacherId, dbQuestionType(text(str(body.get("type")), "SINGLE_CHOICE")),
            text(str(body.get("prompt")), text(str(body.get("content")), "CÃ¢u há»i")), str(body.get("explanation")),
            text(str(body.get("subject")), "Chung"), text(str(body.get("topic")), "Chung"), enumText(str(body.get("difficulty")), "EASY"), intVal(body.get("points"), 1));
        List<Object> opts = rawList(body.get("options"));
        Object correct = body.get("correctAnswer");
        for (int i = 0; i < opts.size(); i++) {
            Object opt = opts.get(i);
            String content = opt instanceof Map<?, ?> map ? str(map.get("content")) : str(opt);
            boolean ok = opt instanceof Map<?, ?> map ? bool(map.get("isCorrect")) : answerContains(correct, content);
            if (content != null && !content.isBlank()) {
                jdbc.update("insert into \"QuestionOption\" (\"id\", \"questionId\", \"content\", \"isCorrect\", \"orderIndex\") values (?, ?, ?, ?, ?)", UUID.randomUUID().toString(), id, content, ok, i);
            }
        }
        return id;
    }

    private String teacherId(String teacherId, String email) {
        String id = nullableTeacherId(teacherId, email);
        if (id == null) throw new IllegalStateException("KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n giÃ¡o viÃªn");
        return id;
    }

    private String nullableTeacherId(String teacherId, String email) {
        if (teacherId != null && !teacherId.isBlank()) return teacherId;
        if (email != null && !email.isBlank()) {
            List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" in ('TEACHER'::\"Role\", 'ADMIN'::\"Role\")", String.class, email);
            return ids.isEmpty() ? null : ids.get(0);
        }
        List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'TEACHER'::\"Role\" order by \"createdAt\" limit 1", String.class);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private String studentId(String studentId, String email) {
        if (studentId != null && !studentId.isBlank()) return studentId;
        List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" = 'STUDENT'::\"Role\"", String.class, text(email, "student@example.com"));
        if (!ids.isEmpty()) return ids.get(0);
        ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'STUDENT'::\"Role\" order by \"createdAt\" limit 1", String.class);
        if (ids.isEmpty()) throw new IllegalStateException("KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n há»c sinh");
        return ids.get(0);
    }

    private String testId(String slug) {
        List<String> ids = jdbc.queryForList("select \"id\" from \"Test\" where \"slug\" = ?", String.class, slug);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private int questionCount(String testId) {
        return count("select count(*) from \"TestQuestion\" where \"testId\" = ?", testId);
    }

    private int maxScore(String testId) {
        return count("select coalesce(sum(coalesce(tq.\"pointsOverride\", q.\"points\")), 0) from \"TestQuestion\" tq join \"Question\" q on q.\"id\" = tq.\"questionId\" where tq.\"testId\" = ?", testId);
    }

    private int count(String sql, String id) {
        Integer value = id == null ? jdbc.queryForObject(sql, Integer.class) : jdbc.queryForObject(sql, Integer.class, id);
        return value == null ? 0 : value;
    }

    private String uniqueSlug(String title) {
        String slug = Slugs.fromTitle(title);
        while (testId(slug) != null) slug = Slugs.fromTitle(title);
        return slug;
    }


    private String answerText(Object answer) {
        if (answer instanceof List<?> list) return String.join(", ", list.stream().map(String::valueOf).toList());
        return str(answer);
    }
    private boolean isCorrect(Object answer, List<String> correct) {
        if (answer instanceof List<?> list) return list.stream().map(String::valueOf).sorted().toList().equals(correct.stream().sorted().toList());
        return correct.size() == 1 && correct.get(0).equalsIgnoreCase(str(answer));
    }

    private boolean answerContains(Object correct, String value) {
        if (correct instanceof List<?> list) return list.stream().map(String::valueOf).anyMatch(value::equals);
        return value != null && value.equals(str(correct));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> bodyList(Object value) {
        return value instanceof List<?> list ? list.stream().filter(Map.class::isInstance).map(item -> (Map<String, Object>) item).toList() : List.of();
    }

    private List<Object> rawList(Object value) {
        return value instanceof List<?> list ? new ArrayList<>(list) : List.of();
    }

    private Map<String, Object> objectMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) return Map.of();
        Map<String, Object> out = new LinkedHashMap<>();
        map.forEach((key, val) -> out.put(String.valueOf(key), val));
        return out;
    }

    private String studentType(String type) {
        return switch (type) {
            case "MULTIPLE_CHOICE" -> "multiple";
            case "TRUE_FALSE" -> "true-false";
            case "SHORT_ANSWER" -> "short-answer";
            case "ESSAY" -> "essay";
            default -> "single";
        };
    }

    private String dbQuestionType(String type) {
        return switch (type) {
            case "multiple" -> "MULTIPLE_CHOICE";
            case "true-false" -> "TRUE_FALSE";
            case "short-answer" -> "SHORT_ANSWER";
            case "essay" -> "ESSAY";
            case "single" -> "SINGLE_CHOICE";
            default -> enumText(type, "SINGLE_CHOICE");
        };
    }

    private String enumText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().replace('-', '_').toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Integer nullableInt(Object value) {
        return value == null || str(value).isBlank() ? null : intVal(value, 0);
    }

    private int intVal(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return value == null ? fallback : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private boolean bool(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(str(value));
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private <T> T value(T value, T fallback) {
        return value == null ? fallback : value;
    }

    private String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String iso(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }
}
