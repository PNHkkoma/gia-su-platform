package com.giasu.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.giasu.common.Slugs;
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
public class FoundationCourseService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public FoundationCourseService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> teacherCourses(String teacherId, String teacherEmail, boolean admin) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            select c."id", c."teacherId", c."title", c."description", c."slug", c."status", c."level",
                   c."estimatedMinutes", c."completionRule", c."createdAt", c."updatedAt", u."fullName" as "teacherName",
                   count(distinct fu."id") as "unitCount", count(distinct fl."id") as "lessonCount"
            from "FoundationCourse" c
            join "User" u on u."id" = c."teacherId"
            left join "FoundationUnit" fu on fu."courseId" = c."id"
            left join "FoundationLesson" fl on fl."unitId" = fu."id"
            where 1 = 1
            """);
        if (!admin) {
            if (teacherId != null && !teacherId.isBlank()) {
                sql.append(" and c.\"teacherId\" = ?");
                args.add(teacherId);
            } else if (teacherEmail != null && !teacherEmail.isBlank()) {
                sql.append(" and u.\"email\" = ?");
                args.add(teacherEmail);
            }
        }
        sql.append(" group by c.\"id\", u.\"fullName\" order by c.\"createdAt\" desc");
        return jdbc.query(sql.toString(), (rs, i) -> courseRow(rs), args.toArray());
    }

    public Map<String, Object> teacherCourse(String slug) {
        Map<String, Object> course = courseBySlug(slug, false, null);
        if (course != null) course.put("units", units(String.valueOf(course.get("id")), null, true));
        return course;
    }

    @Transactional
    public Map<String, Object> createCourse(Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        String title = text(str(body.get("title")), "Foundation course");
        jdbc.update("""
            insert into "FoundationCourse" ("id", "teacherId", "title", "description", "slug", "status", "level", "estimatedMinutes", "completionRule", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, teacherId(str(body.get("teacherId")), str(body.get("teacherEmail"))), title, str(body.get("description")),
            Slugs.fromTitle(title), status(str(body.get("status")), "DRAFT"), str(body.get("level")), intVal(body.get("estimatedMinutes"), 0),
            text(str(body.get("completionRule")), "COMPLETE_ALL_LESSONS"));
        return teacherCourse(slugForCourse(id));
    }

    @Transactional
    public Map<String, Object> updateCourse(String slug, Map<String, Object> body) {
        String id = courseId(slug);
        if (id == null) return null;
        jdbc.update("""
            update "FoundationCourse" set
              "title" = coalesce(?, "title"), "description" = coalesce(?, "description"), "status" = coalesce(?, "status"),
              "level" = coalesce(?, "level"), "estimatedMinutes" = coalesce(?, "estimatedMinutes"),
              "completionRule" = coalesce(?, "completionRule"), "updatedAt" = current_timestamp
            where "id" = ?
            """, blankToNull(str(body.get("title")), false), str(body.get("description")), blankToNull(status(str(body.get("status")), null), true),
            str(body.get("level")), nullableInt(body.get("estimatedMinutes")), str(body.get("completionRule")), id);
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> createUnit(String slug, Map<String, Object> body) {
        String courseId = courseId(slug);
        if (courseId == null) return null;
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "FoundationUnit" ("id", "courseId", "title", "description", "orderIndex", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, courseId, text(str(body.get("title")), "Unit mới"), str(body.get("description")), intVal(body.get("orderIndex"), nextUnitOrder(courseId)));
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> updateUnit(String unitId, Map<String, Object> body) {
        String slug = slugForUnit(unitId);
        if (slug == null) return null;
        jdbc.update("""
            update "FoundationUnit" set "title" = coalesce(?, "title"), "description" = coalesce(?, "description"),
              "orderIndex" = coalesce(?, "orderIndex"), "updatedAt" = current_timestamp where "id" = ?
            """, blankToNull(str(body.get("title")), false), str(body.get("description")), nullableInt(body.get("orderIndex")), unitId);
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> createLesson(String unitId, Map<String, Object> body) {
        String slug = slugForUnit(unitId);
        if (slug == null) return null;
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "FoundationLesson" ("id", "unitId", "title", "content", "status", "orderIndex", "estimatedMinutes", "completionCondition", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, unitId, text(str(body.get("title")), "Lesson mới"), str(body.get("content")), status(str(body.get("status")), "DRAFT"),
            intVal(body.get("orderIndex"), nextLessonOrder(unitId)), intVal(body.get("estimatedMinutes"), 10),
            text(str(body.get("completionCondition")), "MARK_AS_DONE"));
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> updateLesson(String lessonId, Map<String, Object> body) {
        String slug = slugForLesson(lessonId);
        if (slug == null) return null;
        jdbc.update("""
            update "FoundationLesson" set "title" = coalesce(?, "title"), "content" = coalesce(?, "content"),
              "status" = coalesce(?, "status"), "orderIndex" = coalesce(?, "orderIndex"),
              "estimatedMinutes" = coalesce(?, "estimatedMinutes"), "completionCondition" = coalesce(?, "completionCondition"),
              "updatedAt" = current_timestamp where "id" = ?
            """, blankToNull(str(body.get("title")), false), str(body.get("content")), blankToNull(status(str(body.get("status")), null), true),
            nullableInt(body.get("orderIndex")), nullableInt(body.get("estimatedMinutes")), str(body.get("completionCondition")), lessonId);
        return teacherCourse(slug);
    }


    @Transactional
    public Map<String, Object> createBlock(String lessonId, Map<String, Object> body) {
        String slug = slugForLesson(lessonId);
        if (slug == null) return null;
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "FoundationLessonBlock" ("id", "lessonId", "type", "content", "orderIndex", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, lessonId, blockType(str(body.get("type"))), text(str(body.get("content")), ""), intVal(body.get("orderIndex"), nextBlockOrder(lessonId)));
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> updateBlock(String blockId, Map<String, Object> body) {
        String slug = slugForBlock(blockId);
        if (slug == null) return null;
        jdbc.update("""
            update "FoundationLessonBlock" set "type" = coalesce(?, "type"), "content" = coalesce(?, "content"),
              "orderIndex" = coalesce(?, "orderIndex"), "updatedAt" = current_timestamp where "id" = ?
            """, blankToNull(blockType(str(body.get("type"))), true), str(body.get("content")), nullableInt(body.get("orderIndex")), blockId);
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> deleteBlock(String blockId) {
        String slug = slugForBlock(blockId);
        if (slug == null) return null;
        jdbc.update("delete from " + "\"FoundationLessonBlock\"" + " where \"id\" = ?", blockId);
        return teacherCourse(slug);
    }

    @Transactional
    public Map<String, Object> reorderBlocks(String lessonId, Map<String, Object> body) {
        String slug = slugForLesson(lessonId);
        if (slug == null) return null;
        List<String> ids = stringList(body.get("blockIds"));
        for (int i = 0; i < ids.size(); i++) {
            jdbc.update("update \"FoundationLessonBlock\" set \"orderIndex\" = ?, \"updatedAt\" = current_timestamp where \"id\" = ? and \"lessonId\" = ?", i, ids.get(i), lessonId);
        }
        return teacherCourse(slug);
    }
    public List<Map<String, Object>> studentCourses(String studentId, String studentEmail) {
        String sid = studentId(studentId, studentEmail);
        return jdbc.query("""
            select c."id", c."teacherId", c."title", c."description", c."slug", c."status", c."level", c."estimatedMinutes", c."completionRule",
                   c."createdAt", c."updatedAt", u."fullName" as "teacherName",
                   count(distinct fl."id") as "lessonCount",
                   count(distinct case when p."status" = 'COMPLETED' then p."lessonId" end) as "completedLessonCount"
            from "FoundationCourse" c
            join "User" u on u."id" = c."teacherId"
            left join "FoundationUnit" fu on fu."courseId" = c."id"
            left join "FoundationLesson" fl on fl."unitId" = fu."id" and fl."status" = 'PUBLISHED'
            left join "FoundationLessonProgress" p on p."courseId" = c."id" and p."studentId" = ?
            where c."status" = 'PUBLISHED'
            group by c."id", u."fullName"
            order by c."createdAt" desc
            """, (rs, i) -> courseRow(rs), sid);
    }

    public Map<String, Object> studentCourse(String slug, String studentId, String studentEmail) {
        String sid = studentId(studentId, studentEmail);
        Map<String, Object> course = courseBySlug(slug, true, sid);
        if (course == null) return null;
        course.put("units", units(String.valueOf(course.get("id")), sid, false));
        course.put("continueLessonId", continueLessonId(String.valueOf(course.get("id")), sid));
        return course;
    }

    @Transactional
    public Map<String, Object> startLesson(String lessonId, String studentId, String studentEmail) {
        String sid = studentId(studentId, studentEmail);
        String courseId = courseIdForLesson(lessonId);
        if (courseId == null) return null;
        upsertProgress(sid, courseId, lessonId, "IN_PROGRESS");
        return progressRow(sid, lessonId);
    }

    @Transactional
    public Map<String, Object> completeLesson(String lessonId, String studentId, String studentEmail) {
        String sid = studentId(studentId, studentEmail);
        String courseId = courseIdForLesson(lessonId);
        if (courseId == null) return null;
        upsertProgress(sid, courseId, lessonId, "COMPLETED");
        return progressRow(sid, lessonId);
    }


    @Transactional
    public Map<String, Object> submitSingleChoiceExercise(String exerciseId, Map<String, Object> body) {
        String sid = studentId(str(body.get("studentId")), str(body.get("studentEmail")));
        Map<String, Object> exercise = exerciseForStudent(exerciseId);
        if (exercise == null) return null;
        if ("FILL_BLANK".equals(exercise.get("type"))) return submitFillBlank(sid, exerciseId, exercise, body);
        if ("REORDER_WORDS".equals(exercise.get("type"))) return submitReorderWords(sid, exerciseId, exercise, body);
        if ("MATCHING".equals(exercise.get("type"))) return submitMatching(sid, exerciseId, exercise, body);
        if ("ERROR_CORRECTION".equals(exercise.get("type"))) return submitErrorCorrection(sid, exerciseId, exercise, body);
        if ("SHORT_SENTENCE".equals(exercise.get("type"))) return submitShortSentence(sid, exerciseId, exercise, body);
        if (!"SINGLE_CHOICE".equals(exercise.get("type"))) throw new IllegalStateException("Only SINGLE_CHOICE, FILL_BLANK, REORDER_WORDS, MATCHING, ERROR_CORRECTION and SHORT_SENTENCE are supported in this phase");
        String selectedOptionId = str(body.get("selectedOptionId"));
        if (selectedOptionId == null || selectedOptionId.isBlank()) throw new IllegalStateException("Please choose an option before checking");
        List<Map<String, Object>> options = parseObjectList(str(exercise.get("optionsJson")));
        Map<String, Object> selected = null;
        Map<String, Object> correct = null;
        for (Map<String, Object> option : options) {
            if (Boolean.TRUE.equals(option.get("isCorrect"))) correct = option;
            if (selectedOptionId.equals(str(option.get("id")))) selected = option;
        }
        if (selected == null) throw new IllegalStateException("Selected option is not valid");
        boolean isCorrect = Boolean.TRUE.equals(selected.get("isCorrect"));
        double maxScore = doubleVal(exercise.get("score"), 0);
        double score = isCorrect ? maxScore : 0;
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?::jsonb, ?, ?, ?, 'SUBMITTED', current_timestamp, current_timestamp)
            """, id, sid, exerciseId, selectedOptionId, json(Map.of("selectedOptionId", selectedOptionId)), isCorrect, score, maxScore);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("selectedOptionId", selectedOptionId); row.put("isCorrect", isCorrect);
        row.put("score", score); row.put("maxScore", maxScore); row.put("status", isCorrect ? "CORRECT" : "INCORRECT");
        row.put("correctOptionId", correct == null ? null : correct.get("id"));
        row.put("explanation", exercise.get("explanation"));
        return row;
    }

    private Map<String, Object> submitFillBlank(String studentId, String exerciseId, Map<String, Object> exercise, Map<String, Object> body) {
        List<String> answers = stringList(body.get("blankAnswers"));
        List<Map<String, Object>> configs = parseObjectList(str(exercise.get("acceptedAnswersJson")));
        if (configs.isEmpty()) throw new IllegalStateException("FILL_BLANK exercise has no accepted answers");
        if (answers.size() != configs.size()) throw new IllegalStateException("Please answer every blank before checking");

        double maxScore = doubleVal(exercise.get("score"), 0);
        double perBlank = configs.isEmpty() ? 0 : maxScore / configs.size();
        double totalScore = 0;
        boolean allCorrect = true;
        List<Map<String, Object>> blankResults = new ArrayList<>();

        for (int i = 0; i < configs.size(); i++) {
            Map<String, Object> config = configs.get(i);
            String answer = answers.get(i);
            boolean caseSensitive = bool(config.get("caseSensitive"));
            boolean trimWhitespace = !config.containsKey("trimWhitespace") || bool(config.get("trimWhitespace"));
            boolean collapseWhitespace = !config.containsKey("collapseWhitespace") || bool(config.get("collapseWhitespace"));
            List<String> accepted = stringList(config.get("answers"));
            String normalizedAnswer = normalizeBlank(answer, caseSensitive, trimWhitespace, collapseWhitespace);
            boolean correct = accepted.stream().anyMatch(item -> normalizeBlank(item, caseSensitive, trimWhitespace, collapseWhitespace).equals(normalizedAnswer));
            double blankScore = correct ? perBlank : 0;
            if (!correct) allCorrect = false;
            totalScore += blankScore;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("blankIndex", i);
            result.put("answer", answer);
            result.put("isCorrect", correct);
            result.put("score", blankScore);
            result.put("maxScore", perBlank);
            result.put("acceptedAnswers", accepted);
            result.put("explanation", str(config.get("explanation")));
            blankResults.add(result);
        }

        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, null, ?::jsonb, ?, ?, ?, 'SUBMITTED', current_timestamp, current_timestamp)
            """, id, studentId, exerciseId, json(Map.of("blankAnswers", answers, "blankResults", blankResults)), allCorrect, totalScore, maxScore);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("isCorrect", allCorrect);
        row.put("score", totalScore); row.put("maxScore", maxScore); row.put("status", allCorrect ? "CORRECT" : "INCORRECT");
        row.put("blankResults", blankResults);
        row.put("explanation", exercise.get("explanation"));
        return row;
    }


    private Map<String, Object> submitReorderWords(String studentId, String exerciseId, Map<String, Object> exercise, Map<String, Object> body) {
        List<String> submittedOrder = stringList(body.get("submittedOrder"));
        List<String> correctOrder = stringList(parseJsonList(str(exercise.get("correctOrderJson"))));
        if (correctOrder.isEmpty()) throw new IllegalStateException("REORDER_WORDS exercise has no correct order");
        if (submittedOrder.size() != correctOrder.size()) throw new IllegalStateException("Please use every token before checking");
        boolean isCorrect = submittedOrder.equals(correctOrder);
        double maxScore = doubleVal(exercise.get("score"), 0);
        double score = isCorrect ? maxScore : 0;
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, null, ?::jsonb, ?, ?, ?, 'SUBMITTED', current_timestamp, current_timestamp)
            """, id, studentId, exerciseId, json(Map.of("submittedOrder", submittedOrder, "correctOrder", correctOrder)), isCorrect, score, maxScore);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("isCorrect", isCorrect);
        row.put("score", score); row.put("maxScore", maxScore); row.put("status", isCorrect ? "CORRECT" : "INCORRECT");
        row.put("submittedOrder", submittedOrder);
        row.put("correctOrder", correctOrder);
        row.put("correctSentence", joinTokens(correctOrder));
        row.put("explanation", exercise.get("explanation"));
        return row;
    }

    private Map<String, Object> submitMatching(String studentId, String exerciseId, Map<String, Object> exercise, Map<String, Object> body) {
        List<Map<String, Object>> pairs = parseObjectList(str(exercise.get("matchingPairsJson")));
        List<Map<String, Object>> submitted = parseObjectList(json(body.get("matches")));
        if (pairs.isEmpty()) throw new IllegalStateException("MATCHING exercise has no pairs");
        if (submitted.size() != pairs.size()) throw new IllegalStateException("Please match every pair before checking");

        Map<String, String> correctByLeft = new LinkedHashMap<>();
        Map<String, String> leftText = new LinkedHashMap<>();
        Map<String, String> rightText = new LinkedHashMap<>();
        for (Map<String, Object> pair : pairs) {
            String id = str(pair.get("id"));
            correctByLeft.put(id, id);
            leftText.put(id, str(pair.get("left")));
            rightText.put(id, str(pair.get("right")));
        }

        double maxScore = doubleVal(exercise.get("score"), 0);
        double perPair = pairs.isEmpty() ? 0 : maxScore / pairs.size();
        double totalScore = 0;
        boolean allCorrect = true;
        List<Map<String, Object>> matchResults = new ArrayList<>();

        for (Map<String, Object> match : submitted) {
            String leftId = str(match.get("leftId"));
            String rightId = str(match.get("rightId"));
            if (!correctByLeft.containsKey(leftId) || !rightText.containsKey(rightId)) throw new IllegalStateException("Submitted match is not valid");
            boolean correct = rightId.equals(correctByLeft.get(leftId));
            if (!correct) allCorrect = false;
            double pairScore = correct ? perPair : 0;
            totalScore += pairScore;
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("leftId", leftId);
            result.put("rightId", rightId);
            result.put("correctRightId", correctByLeft.get(leftId));
            result.put("left", leftText.get(leftId));
            result.put("right", rightText.get(rightId));
            result.put("correctRight", rightText.get(correctByLeft.get(leftId)));
            result.put("isCorrect", correct);
            result.put("score", pairScore);
            result.put("maxScore", perPair);
            matchResults.add(result);
        }

        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, null, ?::jsonb, ?, ?, ?, 'SUBMITTED', current_timestamp, current_timestamp)
            """, id, studentId, exerciseId, json(Map.of("matches", submitted, "matchResults", matchResults)), allCorrect, totalScore, maxScore);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("isCorrect", allCorrect);
        row.put("score", totalScore); row.put("maxScore", maxScore); row.put("status", allCorrect ? "CORRECT" : "INCORRECT");
        row.put("matchResults", matchResults);
        row.put("explanation", exercise.get("explanation"));
        return row;
    }

    private Map<String, Object> submitErrorCorrection(String studentId, String exerciseId, Map<String, Object> exercise, Map<String, Object> body) {
        Map<String, Object> config = firstObject(str(exercise.get("acceptedAnswersJson")));
        String correctionAnswer = str(body.get("correctionAnswer"));
        String selectedErrorText = str(body.get("selectedErrorText"));
        if (correctionAnswer == null || correctionAnswer.isBlank()) throw new IllegalStateException("Please enter the correction before checking");
        String errorText = str(config.get("errorText"));
        List<String> accepted = stringList(config.get("answers"));
        if (accepted.isEmpty()) accepted = stringList(config.get("acceptedAnswers"));
        if (accepted.isEmpty()) throw new IllegalStateException("ERROR_CORRECTION exercise has no accepted answers");
        boolean answerCorrect = accepted.stream().anyMatch(answer -> normalizeBlank(answer, false, true, true).equals(normalizeBlank(correctionAnswer, false, true, true)));
        boolean selectionCorrect = selectedErrorText == null || selectedErrorText.isBlank() || normalizeBlank(selectedErrorText, false, true, true).equals(normalizeBlank(errorText, false, true, true));
        boolean isCorrect = answerCorrect && selectionCorrect;
        double maxScore = doubleVal(exercise.get("score"), 0);
        double score = isCorrect ? maxScore : 0;
        String correctSentence = str(config.get("correctSentence"));
        if ((correctSentence == null || correctSentence.isBlank()) && errorText != null && !errorText.isBlank() && !accepted.isEmpty()) {
            correctSentence = str(exercise.get("question")).replaceFirst(java.util.regex.Pattern.quote(errorText), java.util.regex.Matcher.quoteReplacement(accepted.get(0)));
        }
        String id = UUID.randomUUID().toString();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("selectedErrorText", selectedErrorText);
        payload.put("correctionAnswer", correctionAnswer);
        payload.put("answerCorrect", answerCorrect);
        payload.put("selectionCorrect", selectionCorrect);
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, null, ?::jsonb, ?, ?, ?, 'SUBMITTED', current_timestamp, current_timestamp)
            """, id, studentId, exerciseId, json(payload), isCorrect, score, maxScore);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("isCorrect", isCorrect);
        row.put("score", score); row.put("maxScore", maxScore); row.put("status", isCorrect ? "CORRECT" : "INCORRECT");
        row.put("errorText", errorText);
        row.put("selectedErrorText", selectedErrorText);
        row.put("acceptedAnswers", accepted);
        row.put("correctSentence", correctSentence);
        row.put("explanation", exercise.get("explanation"));
        return row;
    }

    private Map<String, Object> submitShortSentence(String studentId, String exerciseId, Map<String, Object> exercise, Map<String, Object> body) {
        Map<String, Object> config = firstObject(str(exercise.get("acceptedAnswersJson")));
        String answer = str(body.get("answer"));
        if (answer == null || answer.isBlank()) throw new IllegalStateException("Please enter a short sentence before submitting");
        String gradingMode = "MANUAL".equals(str(config.get("gradingMode"))) ? "MANUAL" : "AUTO_EXACT";
        List<String> accepted = stringList(config.get("acceptedAnswers"));
        String sampleAnswer = str(config.get("sampleAnswer"));
        double maxScore = doubleVal(exercise.get("score"), 0);
        boolean isCorrect = false;
        double score = 0;
        String attemptStatus = "SUBMITTED";
        String playerStatus = "PENDING_GRADING";

        if ("AUTO_EXACT".equals(gradingMode)) {
            if (accepted.isEmpty()) throw new IllegalStateException("AUTO_EXACT SHORT_SENTENCE has no accepted answers");
            String normalizedAnswer = normalizeBlank(answer, false, true, true);
            isCorrect = accepted.stream().anyMatch(item -> normalizeBlank(item, false, true, true).equals(normalizedAnswer));
            score = isCorrect ? maxScore : 0;
            playerStatus = isCorrect ? "CORRECT" : "INCORRECT";
        } else {
            attemptStatus = "PENDING_GRADING";
        }

        String id = UUID.randomUUID().toString();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("answer", answer);
        payload.put("gradingMode", gradingMode);
        payload.put("acceptedAnswers", accepted);
        payload.put("sampleAnswer", sampleAnswer);
        jdbc.update("""
            insert into "ExerciseAttempt" ("id", "studentId", "exerciseId", "selectedOptionId", "answerPayload", "isCorrect", "score", "maxScore", "status", "createdAt", "updatedAt")
            values (?, ?, ?, null, ?::jsonb, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, studentId, exerciseId, json(payload), isCorrect, score, maxScore, attemptStatus);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id); row.put("exerciseId", exerciseId); row.put("isCorrect", isCorrect);
        row.put("score", score); row.put("maxScore", maxScore); row.put("status", playerStatus);
        row.put("gradingMode", gradingMode);
        row.put("sampleAnswer", sampleAnswer);
        row.put("explanation", exercise.get("explanation"));
        return row;
    }    private void upsertProgress(String studentId, String courseId, String lessonId, String status) {
        jdbc.update("""
            insert into "FoundationLessonProgress" ("id", "studentId", "courseId", "lessonId", "status", "startedAt", "completedAt", "updatedAt")
            values (?, ?, ?, ?, ?, current_timestamp, case when ? = 'COMPLETED' then current_timestamp else null end, current_timestamp)
            on conflict ("studentId", "lessonId") do update set "status" = excluded."status",
              "completedAt" = case when excluded."status" = 'COMPLETED' then current_timestamp else "FoundationLessonProgress"."completedAt" end,
              "updatedAt" = current_timestamp
            """, UUID.randomUUID().toString(), studentId, courseId, lessonId, status, status);
    }

    private Map<String, Object> courseBySlug(String slug, boolean publishedOnly, String studentId) {
        String extra = publishedOnly ? " and c.\"status\" = 'PUBLISHED'" : "";
        List<Map<String, Object>> rows = jdbc.query("""
            select c."id", c."teacherId", c."title", c."description", c."slug", c."status", c."level", c."estimatedMinutes", c."completionRule",
                   c."createdAt", c."updatedAt", u."fullName" as "teacherName",
                   count(distinct fl."id") as "lessonCount",
                   count(distinct case when p."status" = 'COMPLETED' then p."lessonId" end) as "completedLessonCount"
            from "FoundationCourse" c
            join "User" u on u."id" = c."teacherId"
            left join "FoundationUnit" fu on fu."courseId" = c."id"
            left join "FoundationLesson" fl on fl."unitId" = fu."id" """ + (publishedOnly ? " and fl.\"status\" = 'PUBLISHED'" : "") + """
            left join "FoundationLessonProgress" p on p."courseId" = c."id" and p."studentId" = ?
            where c."slug" = ?
            """ + extra + " group by c.\"id\", u.\"fullName\"", (rs, i) -> courseRow(rs), studentId, slug);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private List<Map<String, Object>> units(String courseId, String studentId, boolean includeDraft) {
        List<Map<String, Object>> units = jdbc.query("""
            select "id", "title", "description", "orderIndex" from "FoundationUnit" where "courseId" = ? order by "orderIndex" asc, "createdAt" asc
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id")); row.put("title", rs.getString("title")); row.put("description", rs.getString("description")); row.put("orderIndex", rs.getInt("orderIndex"));
            row.put("lessons", lessons(rs.getString("id"), studentId, includeDraft));
            return row;
        }, courseId);
        return units;
    }

    private List<Map<String, Object>> lessons(String unitId, String studentId, boolean includeDraft) {
        String where = includeDraft ? "" : " and l.\"status\" = 'PUBLISHED'";
        return jdbc.query("""
            select l."id", l."title", l."content", l."status", l."orderIndex", l."estimatedMinutes", l."completionCondition",
                   p."status" as "progressStatus", p."startedAt", p."completedAt"
            from "FoundationLesson" l
            left join "FoundationLessonProgress" p on p."lessonId" = l."id" and p."studentId" = ?
            where l."unitId" = ?
            """ + where + " order by l.\"orderIndex\" asc, l.\"createdAt\" asc", (rs, i) -> lessonRow(rs), studentId, unitId);
    }

    private Map<String, Object> courseRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id")); row.put("teacherId", rs.getString("teacherId")); row.put("title", rs.getString("title"));
        row.put("description", rs.getString("description")); row.put("slug", rs.getString("slug")); row.put("status", rs.getString("status"));
        row.put("level", rs.getString("level")); row.put("estimatedMinutes", rs.getInt("estimatedMinutes")); row.put("completionRule", rs.getString("completionRule"));
        row.put("teacherName", rs.getString("teacherName"));
        safePutInt(row, rs, "unitCount"); safePutInt(row, rs, "lessonCount"); safePutInt(row, rs, "completedLessonCount");
        row.put("createdAt", iso(rs.getTimestamp("createdAt"))); row.put("updatedAt", iso(rs.getTimestamp("updatedAt")));
        return row;
    }

    private Map<String, Object> lessonRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id")); row.put("title", rs.getString("title")); row.put("content", rs.getString("content")); row.put("status", rs.getString("status"));
        row.put("orderIndex", rs.getInt("orderIndex")); row.put("estimatedMinutes", rs.getInt("estimatedMinutes")); row.put("completionCondition", rs.getString("completionCondition"));
        String progress = rs.getString("progressStatus"); row.put("progressStatus", progress == null ? "NOT_STARTED" : progress);
        row.put("startedAt", iso(rs.getTimestamp("startedAt"))); row.put("completedAt", iso(rs.getTimestamp("completedAt"))); row.put("blocks", blocks(rs.getString("id")));
        return row;
    }

    private Map<String, Object> progressRow(String studentId, String lessonId) {
        return jdbc.queryForObject("select \"lessonId\", \"status\", \"startedAt\", \"completedAt\" from \"FoundationLessonProgress\" where \"studentId\" = ? and \"lessonId\" = ?", (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>(); row.put("lessonId", rs.getString("lessonId")); row.put("status", rs.getString("status")); row.put("startedAt", iso(rs.getTimestamp("startedAt"))); row.put("completedAt", iso(rs.getTimestamp("completedAt"))); return row;
        }, studentId, lessonId);
    }

    private List<Map<String, Object>> blocks(String lessonId) {
        return jdbc.query("""
            select "id", "type", "content", "orderIndex" from "FoundationLessonBlock" where "lessonId" = ? order by "orderIndex" asc, "createdAt" asc
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id")); row.put("type", rs.getString("type")); row.put("content", rs.getString("content")); row.put("orderIndex", rs.getInt("orderIndex"));
            row.put("grammarExercises", grammarExercises(rs.getString("id")));
            return row;
        }, lessonId);
    }


    private List<Map<String, Object>> grammarExercises(String blockId) {
        return jdbc.query("""
            select "id", "lessonId", "lessonBlockId", "type", "instruction", "question", "explanation", "hint", "score", "orderIndex", "status", "options"::text as "optionsJson", "wordTokens"::text as "wordTokensJson", "matchingPairs"::text as "matchingPairsJson"
            from "GrammarExercise"
            where "lessonBlockId" = ? and "status" = 'PUBLISHED'::"GrammarExerciseStatus"
            order by "orderIndex" asc, "createdAt" asc
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();            String type = rs.getString("type");
            row.put("id", rs.getString("id")); row.put("lessonId", rs.getString("lessonId")); row.put("lessonBlockId", rs.getString("lessonBlockId"));
            row.put("type", type); row.put("instruction", rs.getString("instruction")); row.put("question", "REORDER_WORDS".equals(type) ? "Sắp xếp các token thành câu đúng." : rs.getString("question"));
            row.put("explanation", rs.getString("explanation")); row.put("hint", rs.getString("hint")); row.put("score", rs.getInt("score"));
            row.put("orderIndex", rs.getInt("orderIndex")); row.put("status", rs.getString("status")); row.put("options", safeOptions(rs.getString("optionsJson"))); row.put("wordTokens", parseJsonList(rs.getString("wordTokensJson"))); row.put("matchingPairs", safeMatchingPairs(rs.getString("matchingPairsJson")));
            return row;
        }, blockId);
    }

    private Map<String, Object> exerciseForStudent(String exerciseId) {
        List<Map<String, Object>> rows = jdbc.query("""
            select ge."id", ge."type", ge."question", ge."score", ge."options"::text as "optionsJson", ge."acceptedAnswers"::text as "acceptedAnswersJson", ge."wordTokens"::text as "wordTokensJson", ge."correctOrder"::text as "correctOrderJson", ge."matchingPairs"::text as "matchingPairsJson", ge."explanation"
            from "GrammarExercise" ge
            join "FoundationLessonBlock" b on b."id" = ge."lessonBlockId"
            join "FoundationLesson" l on l."id" = b."lessonId"
            join "FoundationUnit" u on u."id" = l."unitId"
            join "FoundationCourse" c on c."id" = u."courseId"
            where ge."id" = ? and ge."status" = 'PUBLISHED'::"GrammarExerciseStatus" and l."status" = 'PUBLISHED' and c."status" = 'PUBLISHED'
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id")); row.put("type", rs.getString("type")); row.put("question", rs.getString("question")); row.put("score", rs.getInt("score"));
            row.put("optionsJson", rs.getString("optionsJson")); row.put("acceptedAnswersJson", rs.getString("acceptedAnswersJson")); row.put("wordTokensJson", rs.getString("wordTokensJson")); row.put("correctOrderJson", rs.getString("correctOrderJson")); row.put("matchingPairsJson", rs.getString("matchingPairsJson")); row.put("explanation", rs.getString("explanation"));
            return row;
        }, exerciseId);
        return rows.isEmpty() ? null : rows.get(0);
    }



    private Map<String, Object> firstObject(String json) {
        List<Map<String, Object>> list = parseObjectList(json);
        return list.isEmpty() ? Map.of() : list.get(0);
    }
    private List<?> parseJsonList(String json) {
        try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<?>>() {}); }
        catch (Exception ex) { return List.of(); }
    }

    private String joinTokens(List<String> tokens) {
        StringBuilder builder = new StringBuilder();
        for (String token : tokens) {
            if (token == null || token.isBlank()) continue;
            if (builder.length() == 0 || token.matches("[.,!?;:%)]")) builder.append(token);
            else builder.append(' ').append(token);
        }
        return builder.toString().trim();
    }
    private List<Map<String, Object>> parseObjectList(String json) {
        try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception ex) { return List.of(); }
    }

    private List<Map<String, Object>> safeOptions(String json) {
        List<Map<String, Object>> raw = parseObjectList(json);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> option : raw) {
            Map<String, Object> clean = new LinkedHashMap<>();
            clean.put("id", option.get("id")); clean.put("content", option.get("content")); clean.put("orderIndex", option.get("orderIndex"));
            result.add(clean);
        }
        return result;
    }


    private List<Map<String, Object>> safeMatchingPairs(String json) {
        List<Map<String, Object>> raw = parseObjectList(json);
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < raw.size(); i++) {
            Map<String, Object> pair = raw.get(i);
            Map<String, Object> clean = new LinkedHashMap<>();
            clean.put("id", pair.get("id")); clean.put("left", pair.get("left")); clean.put("right", pair.get("right")); clean.put("orderIndex", pair.getOrDefault("orderIndex", i));
            result.add(clean);
        }
        return result;
    }
    private String json(Object value) { try { return objectMapper.writeValueAsString(value == null ? Map.of() : value); } catch (Exception ex) { throw new IllegalStateException("Invalid JSON payload"); } }
    private String slugForBlock(String id) {
        List<String> rows = jdbc.queryForList("select c.\"slug\" from \"FoundationLessonBlock\" b join \"FoundationLesson\" l on l.\"id\" = b.\"lessonId\" join \"FoundationUnit\" u on u.\"id\" = l.\"unitId\" join \"FoundationCourse\" c on c.\"id\" = u.\"courseId\" where b.\"id\" = ?", String.class, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private int nextBlockOrder(String lessonId) {
        Integer v = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"FoundationLessonBlock\" where \"lessonId\" = ?", Integer.class, lessonId);
        return v == null ? 0 : v;
    }

    private String blockType(String value) {
        if (value == null || value.isBlank()) return "TEXT";
        String v = value.toUpperCase();
        return v.equals("HEADING") || v.equals("CALLOUT") || v.equals("QUOTE") || v.equals("TEXT") || v.equals("GRAMMAR_EXERCISE") ? v : "TEXT";
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> raw)) return List.of();
        List<String> result = new ArrayList<>();
        for (Object item : raw) if (item != null && !String.valueOf(item).isBlank()) result.add(String.valueOf(item));
        return result;
    }
    private void safePutInt(Map<String, Object> row, java.sql.ResultSet rs, String key) { try { row.put(key, rs.getInt(key)); } catch (Exception ignored) {} }
    private String courseId(String slug) { List<String> ids = jdbc.queryForList("select \"id\" from \"FoundationCourse\" where \"slug\" = ?", String.class, slug); return ids.isEmpty() ? null : ids.get(0); }
    private String slugForCourse(String id) { return jdbc.queryForObject("select \"slug\" from \"FoundationCourse\" where \"id\" = ?", String.class, id); }
    private String slugForUnit(String id) { List<String> rows = jdbc.queryForList("select c.\"slug\" from \"FoundationUnit\" u join \"FoundationCourse\" c on c.\"id\" = u.\"courseId\" where u.\"id\" = ?", String.class, id); return rows.isEmpty() ? null : rows.get(0); }
    private String slugForLesson(String id) { List<String> rows = jdbc.queryForList("select c.\"slug\" from \"FoundationLesson\" l join \"FoundationUnit\" u on u.\"id\" = l.\"unitId\" join \"FoundationCourse\" c on c.\"id\" = u.\"courseId\" where l.\"id\" = ?", String.class, id); return rows.isEmpty() ? null : rows.get(0); }
    private String courseIdForLesson(String id) { List<String> rows = jdbc.queryForList("select u.\"courseId\" from \"FoundationLesson\" l join \"FoundationUnit\" u on u.\"id\" = l.\"unitId\" where l.\"id\" = ? and l.\"status\" = 'PUBLISHED'", String.class, id); return rows.isEmpty() ? null : rows.get(0); }
    private String continueLessonId(String courseId, String studentId) {
        List<String> active = jdbc.queryForList("select \"lessonId\" from \"FoundationLessonProgress\" where \"courseId\" = ? and \"studentId\" = ? and \"status\" = 'IN_PROGRESS' order by \"updatedAt\" desc limit 1", String.class, courseId, studentId);
        if (!active.isEmpty()) return active.get(0);
        List<String> next = jdbc.queryForList("select l.\"id\" from \"FoundationLesson\" l join \"FoundationUnit\" u on u.\"id\" = l.\"unitId\" left join \"FoundationLessonProgress\" p on p.\"lessonId\" = l.\"id\" and p.\"studentId\" = ? where u.\"courseId\" = ? and l.\"status\" = 'PUBLISHED' and coalesce(p.\"status\", 'NOT_STARTED') <> 'COMPLETED' order by u.\"orderIndex\", l.\"orderIndex\" limit 1", String.class, studentId, courseId);
        return next.isEmpty() ? null : next.get(0);
    }

    private String normalizeBlank(String value, boolean caseSensitive, boolean trimWhitespace, boolean collapseWhitespace) {
        String result = value == null ? "" : value;
        if (trimWhitespace) result = result.trim();
        if (collapseWhitespace) result = result.replaceAll("\\s+", " ");
        return caseSensitive ? result : result.toLowerCase(java.util.Locale.ROOT);
    }

    private double doubleVal(Object value, double fallback) {
        if (value == null || String.valueOf(value).isBlank()) return fallback;
        try { return Double.parseDouble(String.valueOf(value)); } catch (NumberFormatException ex) { return fallback; }
    }
    private int nextUnitOrder(String courseId) { Integer v = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"FoundationUnit\" where \"courseId\" = ?", Integer.class, courseId); return v == null ? 0 : v; }
    private int nextLessonOrder(String unitId) { Integer v = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"FoundationLesson\" where \"unitId\" = ?", Integer.class, unitId); return v == null ? 0 : v; }
    private String teacherId(String teacherId, String email) { if (teacherId != null && !teacherId.isBlank()) return teacherId; if (email != null && !email.isBlank()) { List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" in ('TEACHER'::\"Role\", 'ADMIN'::\"Role\")", String.class, email); if (!ids.isEmpty()) return ids.get(0); } List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'TEACHER'::\"Role\" order by \"createdAt\" limit 1", String.class); if (ids.isEmpty()) throw new IllegalStateException("Teacher not found"); return ids.get(0); }
    private String studentId(String studentId, String email) { if (studentId != null && !studentId.isBlank()) return studentId; List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" = 'STUDENT'::\"Role\"", String.class, text(email, "student@example.com")); if (!ids.isEmpty()) return ids.get(0); ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'STUDENT'::\"Role\" order by \"createdAt\" limit 1", String.class); if (ids.isEmpty()) throw new IllegalStateException("Student not found"); return ids.get(0); }
    private String status(String value, String fallback) { if (value == null || value.isBlank()) return fallback; String v = value.toUpperCase(); return v.equals("PUBLISHED") ? "PUBLISHED" : v.equals("DRAFT") ? "DRAFT" : fallback; }
    private String str(Object value) { return value == null ? null : String.valueOf(value); }
    private boolean bool(Object value) { return value != null && Boolean.parseBoolean(String.valueOf(value)); }
    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private String blankToNull(String value, boolean blankIsNull) { return value == null || (blankIsNull && value.isBlank()) ? null : value; }
    private int intVal(Object value, int fallback) { Integer v = nullableInt(value); return v == null ? fallback : v; }
    private Integer nullableInt(Object value) { if (value == null || String.valueOf(value).isBlank()) return null; try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException e) { return null; } }
    private String iso(Timestamp value) { return value == null ? null : value.toInstant().toString(); }
}
