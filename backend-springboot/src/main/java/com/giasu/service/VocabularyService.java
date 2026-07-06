package com.giasu.service;

import com.giasu.common.Slugs;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class VocabularyService {
    private final JdbcTemplate jdbc;

    public VocabularyService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> teacherSets(String teacherId, String teacherEmail, boolean admin) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            select vs."id", vs."teacherId", vs."title", vs."description", vs."slug", vs."subject", vs."level",
                   vs."status", vs."createdAt", vs."updatedAt", u."fullName" as "teacherName",
                   count(distinct vi."id") as "itemCount",
                   count(distinct va."id") as "assignmentCount"
            from "VocabularySet" vs
            join "User" u on u."id" = vs."teacherId"
            left join "VocabularyItem" vi on vi."vocabularySetId" = vs."id"
            left join "VocabularyAssignment" va on va."vocabularySetId" = vs."id"
            where 1 = 1
            """);
        if (!admin) {
            if (teacherId != null && !teacherId.isBlank()) {
                sql.append(" and vs.\"teacherId\" = ?");
                args.add(teacherId);
            } else if (teacherEmail != null && !teacherEmail.isBlank()) {
                sql.append(" and u.\"email\" = ?");
                args.add(teacherEmail);
            }
        }
        sql.append(" group by vs.\"id\", u.\"fullName\" order by vs.\"createdAt\" desc");
        return jdbc.query(sql.toString(), (rs, i) -> setRow(rs), args.toArray());
    }

    public Map<String, Object> teacherSet(String slug) {
        List<Map<String, Object>> rows = jdbc.query("""
            select vs."id", vs."teacherId", vs."title", vs."description", vs."slug", vs."subject", vs."level",
                   vs."status", vs."createdAt", vs."updatedAt", u."fullName" as "teacherName",
                   coalesce(count(distinct vi."id"), 0) as "itemCount",
                   coalesce(count(distinct va."id"), 0) as "assignmentCount"
            from "VocabularySet" vs
            join "User" u on u."id" = vs."teacherId"
            left join "VocabularyItem" vi on vi."vocabularySetId" = vs."id"
            left join "VocabularyAssignment" va on va."vocabularySetId" = vs."id"
            where vs."slug" = ?
            group by vs."id", u."fullName"
            """, (rs, i) -> setRow(rs), slug);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> teacherItems(String slug, int page, int pageSize, String query) {
        String setId = setId(slug);
        if (setId == null) return null;

        int safePageSize = Math.max(1, Math.min(pageSize, 50));
        String trimmedQuery = queryText(query);
        long totalItems = countItems(setId, trimmedQuery);
        int totalPages = Math.max(1, (int) Math.ceil(totalItems / (double) safePageSize));
        int safePage = Math.max(1, Math.min(page, totalPages));
        int offset = (safePage - 1) * safePageSize;

        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            select "id", "word", "term", "phonetic", "partOfSpeech", "meaningVi", "meaning", "meaningEn",
                   "exampleSentence", "example", "exampleMeaningVi", "tags", "orderIndex", "createdAt", "updatedAt"
            from "VocabularyItem"
            where "vocabularySetId" = ?
            """);
        args.add(setId);
        appendItemSearchFilter(sql, args, trimmedQuery);
        sql.append(" order by \"orderIndex\" asc, \"createdAt\" asc limit ? offset ?");
        args.add(safePageSize);
        args.add(offset);

        List<Map<String, Object>> items = jdbc.query(sql.toString(), (rs, i) -> itemRow(rs), args.toArray());
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("items", items);
        payload.put("query", trimmedQuery == null ? "" : trimmedQuery);
        payload.put("pagination", Map.of(
            "page", safePage,
            "pageSize", safePageSize,
            "totalItems", totalItems,
            "totalPages", totalPages
        ));
        return payload;
    }

    public Map<String, Object> assignmentAudience(String teacherId, String teacherEmail, boolean admin) {
        String resolvedTeacherId = admin ? null : nullableTeacherId(teacherId, teacherEmail);
        List<Object> args = new ArrayList<>();
        StringBuilder classSql = new StringBuilder("""
            select c."id", c."name", c."subject", c."level", c."status", count(cs."id") as "studentCount"
            from "Class" c
            left join "ClassStudent" cs on cs."classId" = c."id"
            where 1 = 1
            """);
        if (resolvedTeacherId != null) {
            classSql.append(" and c.\"teacherId\" = ?");
            args.add(resolvedTeacherId);
        }
        classSql.append(" group by c.\"id\" order by c.\"createdAt\" desc");
        List<Map<String, Object>> classes = jdbc.query(classSql.toString(), (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("name", rs.getString("name"));
            row.put("subject", rs.getString("subject"));
            row.put("level", rs.getString("level"));
            row.put("status", rs.getString("status"));
            row.put("studentCount", rs.getInt("studentCount"));
            row.put("students", studentsForClass(rs.getString("id")));
            return row;
        }, args.toArray());

        Map<String, Map<String, Object>> students = new LinkedHashMap<>();
        for (Map<String, Object> klass : classes) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> classStudents = (List<Map<String, Object>>) klass.get("students");
            for (Map<String, Object> student : classStudents) {
                String id = String.valueOf(student.get("id"));
                Map<String, Object> current = students.computeIfAbsent(id, key -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", student.get("id"));
                    row.put("fullName", student.get("fullName"));
                    row.put("email", student.get("email"));
                    row.put("classNames", new ArrayList<String>());
                    return row;
                });
                @SuppressWarnings("unchecked")
                List<String> classNames = (List<String>) current.get("classNames");
                classNames.add(String.valueOf(klass.get("name")));
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("classes", classes);
        payload.put("students", new ArrayList<>(students.values()));
        return payload;
    }

    public List<Map<String, Object>> teacherAssignments(String slug) {
        String setId = setId(slug);
        if (setId == null) return List.of();
        return jdbc.query("""
            select va."id", va."title", va."deadline", va."dailyTarget", va."requiredMasteryPercent", va."createdAt",
                   c."id" as "classId", c."name" as "className",
                   u."id" as "studentId", u."fullName" as "studentName", u."email" as "studentEmail"
            from "VocabularyAssignment" va
            left join "Class" c on c."id" = va."classId"
            left join "User" u on u."id" = va."studentId"
            where va."vocabularySetId" = ?
            order by va."createdAt" desc
            """, (rs, i) -> assignmentRow(rs), setId);
    }

    public List<Map<String, Object>> studentAssignments(String studentId, String studentEmail) {
        String resolvedStudentId = studentId(studentId, studentEmail);
        return jdbc.query("""
            select va."id", va."title", va."deadline", va."dailyTarget", va."requiredMasteryPercent", va."createdAt",
                   vs."id" as "setId", vs."title" as "setTitle", vs."slug" as "setSlug", vs."description" as "setDescription",
                   vs."subject" as "subject", vs."level" as "level", vs."status" as "setStatus",
                   teacher."fullName" as "teacherName",
                   c."id" as "classId", c."name" as "className",
                   count(distinct vi."id") as "itemCount"
            from "VocabularyAssignment" va
            join "VocabularySet" vs on vs."id" = va."vocabularySetId"
            join "User" teacher on teacher."id" = vs."teacherId"
            left join "Class" c on c."id" = va."classId"
            left join "VocabularyItem" vi on vi."vocabularySetId" = vs."id"
            left join "ClassStudent" cs on cs."classId" = va."classId" and cs."studentId" = ?
            where va."studentId" = ? or cs."id" is not null
            group by va."id", vs."id", teacher."fullName", c."id"
            order by coalesce(va."deadline", va."createdAt") asc, va."createdAt" desc
            """, (rs, i) -> studentAssignmentRow(rs), resolvedStudentId, resolvedStudentId);
    }

    @Transactional
    public Map<String, Object> createSet(Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        String title = text(str(body.get("title")), "Bo tu vung moi");
        String slug = uniqueSlug(title);
        jdbc.update("""
            insert into "VocabularySet" ("id", "teacherId", "title", "description", "slug", "subject", "level", "status", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, teacherId(str(body.get("teacherId")), str(body.get("teacherEmail"))), title,
            str(body.get("description")), slug, str(body.get("subject")), str(body.get("level")), status(str(body.get("status"))));
        return teacherSet(slug);
    }

    @Transactional
    public Map<String, Object> updateSet(String slug, Map<String, Object> body) {
        String id = setId(slug);
        if (id == null) return null;
        jdbc.update("""
            update "VocabularySet"
            set "title" = coalesce(?, "title"),
                "description" = ?,
                "subject" = ?,
                "level" = ?,
                "status" = coalesce(?, "status"),
                "updatedAt" = current_timestamp
            where "id" = ?
            """, blankToNull(str(body.get("title"))), str(body.get("description")), str(body.get("subject")),
            str(body.get("level")), blankToNull(status(str(body.get("status")))), id);
        return teacherSet(slug);
    }

    @Transactional
    public Map<String, Object> createItem(String slug, Map<String, Object> body) {
        String setId = setId(slug);
        if (setId == null) return null;
        String id = UUID.randomUUID().toString();
        String word = text(str(body.get("word")), "New word");
        String meaningVi = text(str(body.get("meaningVi")), "Chua co nghia");
        int orderIndex = nextOrderIndex(setId);
        jdbc.update("""
            insert into "VocabularyItem" ("id", "vocabularySetId", "term", "meaning", "word", "phonetic", "partOfSpeech",
                                          "meaningVi", "meaningEn", "example", "exampleSentence", "exampleMeaningVi", "tags",
                                          "orderIndex", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
            """, id, setId, word, meaningVi, word, blankToNull(str(body.get("phonetic"))), blankToNull(str(body.get("partOfSpeech"))),
            meaningVi, blankToNull(str(body.get("meaningEn"))), blankToNull(str(body.get("exampleSentence"))), blankToNull(str(body.get("exampleSentence"))),
            blankToNull(str(body.get("exampleMeaningVi"))), tagsArray(tags(body.get("tags"))), orderIndex);
        return item(id);
    }

    @Transactional
    public Map<String, Object> updateItem(String slug, String itemId, Map<String, Object> body) {
        String setId = setId(slug);
        if (setId == null || !itemBelongsToSet(setId, itemId)) return null;
        String word = text(str(body.get("word")), "New word");
        String meaningVi = text(str(body.get("meaningVi")), "Chua co nghia");
        jdbc.update("""
            update "VocabularyItem"
            set "term" = ?,
                "meaning" = ?,
                "word" = ?,
                "phonetic" = ?,
                "partOfSpeech" = ?,
                "meaningVi" = ?,
                "meaningEn" = ?,
                "example" = ?,
                "exampleSentence" = ?,
                "exampleMeaningVi" = ?,
                "tags" = ?,
                "updatedAt" = current_timestamp
            where "id" = ? and "vocabularySetId" = ?
            """, word, meaningVi, word, blankToNull(str(body.get("phonetic"))), blankToNull(str(body.get("partOfSpeech"))),
            meaningVi, blankToNull(str(body.get("meaningEn"))), blankToNull(str(body.get("exampleSentence"))), blankToNull(str(body.get("exampleSentence"))),
            blankToNull(str(body.get("exampleMeaningVi"))), tagsArray(tags(body.get("tags"))), itemId, setId);
        return item(itemId);
    }

    @Transactional
    public List<Map<String, Object>> createAssignments(String slug, Map<String, Object> body) {
        String setId = setId(slug);
        if (setId == null) return List.of();

        String title = text(str(body.get("title")), "Vocabulary assignment");
        Timestamp deadline = timestamp(body.get("deadline"));
        int dailyTarget = boundedInt(body.get("dailyTarget"), 5, 1, 500);
        int requiredMasteryPercent = boundedInt(body.get("requiredMasteryPercent"), 80, 1, 100);
        String classId = blankToNull(str(body.get("classId")));
        LinkedHashSet<String> studentIds = new LinkedHashSet<>(stringList(body.get("studentIds")));

        if (classId == null && studentIds.isEmpty()) {
            throw new IllegalArgumentException("Please choose a class or at least one student");
        }

        List<String> createdIds = new ArrayList<>();
        if (classId != null) {
            createdIds.add(insertAssignment(setId, title, deadline, dailyTarget, requiredMasteryPercent, classId, null));
        }
        for (String studentId : studentIds) {
            createdIds.add(insertAssignment(setId, title, deadline, dailyTarget, requiredMasteryPercent, null, studentId));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (String id : createdIds) {
            result.add(assignmentById(id));
        }
        return result;
    }

    @Transactional
    public boolean deleteItem(String slug, String itemId) {
        String setId = setId(slug);
        if (setId == null) return false;
        int deleted = jdbc.update("delete from \"VocabularyItem\" where \"id\" = ? and \"vocabularySetId\" = ?", itemId, setId);
        return deleted > 0;
    }

    private String insertAssignment(String setId, String title, Timestamp deadline, int dailyTarget, int requiredMasteryPercent, String classId, String studentId) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            insert into "VocabularyAssignment" ("id", "vocabularySetId", "title", "deadline", "dailyTarget", "requiredMasteryPercent", "classId", "studentId", "createdAt")
            values (?, ?, ?, ?, ?, ?, ?, ?, current_timestamp)
            """, id, setId, title, deadline, dailyTarget, requiredMasteryPercent, classId, studentId);
        return id;
    }

    private Map<String, Object> assignmentById(String assignmentId) {
        return jdbc.queryForObject("""
            select va."id", va."title", va."deadline", va."dailyTarget", va."requiredMasteryPercent", va."createdAt",
                   c."id" as "classId", c."name" as "className",
                   u."id" as "studentId", u."fullName" as "studentName", u."email" as "studentEmail"
            from "VocabularyAssignment" va
            left join "Class" c on c."id" = va."classId"
            left join "User" u on u."id" = va."studentId"
            where va."id" = ?
            """, (rs, i) -> assignmentRow(rs), assignmentId);
    }

    private long countItems(String setId, String query) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("select count(*) from \"VocabularyItem\" where \"vocabularySetId\" = ?");
        args.add(setId);
        appendItemSearchFilter(sql, args, query);
        Long value = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return value == null ? 0 : value;
    }

    private void appendItemSearchFilter(StringBuilder sql, List<Object> args, String query) {
        String pattern = searchPattern(query);
        if (pattern == null) return;
        sql.append("""
             and (
                lower(coalesce("word", "term", '')) like ?
                or lower(coalesce("meaningVi", "meaning", '')) like ?
             )
            """);
        args.add(pattern);
        args.add(pattern);
    }

    private List<Map<String, Object>> studentsForClass(String classId) {
        return jdbc.query("""
            select u."id", u."fullName", u."email"
            from "ClassStudent" cs
            join "User" u on u."id" = cs."studentId"
            where cs."classId" = ?
            order by u."fullName" asc
            """, (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("fullName", rs.getString("fullName"));
            row.put("email", rs.getString("email"));
            return row;
        }, classId);
    }

    private Map<String, Object> setRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("teacherId", rs.getString("teacherId"));
        row.put("title", rs.getString("title"));
        row.put("description", rs.getString("description"));
        row.put("slug", rs.getString("slug"));
        row.put("subject", rs.getString("subject"));
        row.put("level", rs.getString("level"));
        row.put("status", rs.getString("status"));
        row.put("teacherName", rs.getString("teacherName"));
        row.put("itemCount", rs.getInt("itemCount"));
        row.put("assignmentCount", rs.getInt("assignmentCount"));
        row.put("createdAt", iso(rs.getTimestamp("createdAt")));
        row.put("updatedAt", iso(rs.getTimestamp("updatedAt")));
        return row;
    }

    private Map<String, Object> assignmentRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("title", rs.getString("title"));
        row.put("deadline", iso(rs.getTimestamp("deadline")));
        row.put("dailyTarget", rs.getInt("dailyTarget"));
        row.put("requiredMasteryPercent", rs.getInt("requiredMasteryPercent"));
        row.put("createdAt", iso(rs.getTimestamp("createdAt")));
        row.put("classId", rs.getString("classId"));
        row.put("className", rs.getString("className"));
        row.put("studentId", rs.getString("studentId"));
        row.put("studentName", rs.getString("studentName"));
        row.put("studentEmail", rs.getString("studentEmail"));
        row.put("targetType", rs.getString("classId") != null ? "CLASS" : "STUDENT");
        row.put("targetLabel", rs.getString("classId") != null ? rs.getString("className") : rs.getString("studentName"));
        return row;
    }

    private Map<String, Object> studentAssignmentRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("title", rs.getString("title"));
        row.put("deadline", iso(rs.getTimestamp("deadline")));
        row.put("dailyTarget", rs.getInt("dailyTarget"));
        row.put("requiredMasteryPercent", rs.getInt("requiredMasteryPercent"));
        row.put("assignedAt", iso(rs.getTimestamp("createdAt")));
        row.put("setId", rs.getString("setId"));
        row.put("setTitle", rs.getString("setTitle"));
        row.put("setSlug", rs.getString("setSlug"));
        row.put("setDescription", rs.getString("setDescription"));
        row.put("subject", rs.getString("subject"));
        row.put("level", rs.getString("level"));
        row.put("teacherName", rs.getString("teacherName"));
        row.put("classId", rs.getString("classId"));
        row.put("className", rs.getString("className"));
        row.put("itemCount", rs.getInt("itemCount"));
        row.put("targetType", rs.getString("classId") != null ? "CLASS" : "STUDENT");
        row.put("status", "Assigned");
        return row;
    }

    private Map<String, Object> item(String id) {
        return jdbc.queryForObject("""
            select "id", "word", "term", "phonetic", "partOfSpeech", "meaningVi", "meaning", "meaningEn",
                   "exampleSentence", "example", "exampleMeaningVi", "tags", "orderIndex", "createdAt", "updatedAt"
            from "VocabularyItem" where "id" = ?
            """, (rs, i) -> itemRow(rs), id);
    }

    private Map<String, Object> itemRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getString("id"));
        row.put("word", text(rs.getString("word"), rs.getString("term")));
        row.put("phonetic", rs.getString("phonetic"));
        row.put("partOfSpeech", rs.getString("partOfSpeech"));
        row.put("meaningVi", text(rs.getString("meaningVi"), rs.getString("meaning")));
        row.put("meaningEn", rs.getString("meaningEn"));
        row.put("exampleSentence", text(rs.getString("exampleSentence"), rs.getString("example")));
        row.put("exampleMeaningVi", rs.getString("exampleMeaningVi"));
        row.put("tags", arrayToList(rs.getArray("tags")));
        row.put("orderIndex", rs.getInt("orderIndex"));
        row.put("createdAt", iso(rs.getTimestamp("createdAt")));
        row.put("updatedAt", iso(rs.getTimestamp("updatedAt")));
        return row;
    }

    private boolean itemBelongsToSet(String setId, String itemId) {
        Integer count = jdbc.queryForObject(
            "select count(*) from \"VocabularyItem\" where \"id\" = ? and \"vocabularySetId\" = ?",
            Integer.class,
            itemId,
            setId
        );
        return count != null && count > 0;
    }

    private Object tagsArray(List<String> tags) {
        return jdbc.execute((ConnectionCallback<Array>) connection -> connection.createArrayOf("text", tags.toArray(new String[0])));
    }

    private List<String> arrayToList(Array array) throws SQLException {
        if (array == null) return List.of();
        Object value = array.getArray();
        if (value instanceof String[] strings) return List.of(strings);
        if (value instanceof Object[] objects) return java.util.Arrays.stream(objects).map(String::valueOf).toList();
        return List.of();
    }

    private List<String> tags(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).map(String::trim).filter(item -> !item.isBlank()).distinct().toList();
        }
        String text = str(value);
        if (text == null || text.isBlank()) return List.of();
        return java.util.Arrays.stream(text.split(",")).map(String::trim).filter(item -> !item.isBlank()).distinct().toList();
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().map(String::valueOf).map(String::trim).filter(item -> !item.isBlank()).distinct().toList();
    }

    private int nextOrderIndex(String setId) {
        Integer value = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"VocabularyItem\" where \"vocabularySetId\" = ?", Integer.class, setId);
        return value == null ? 0 : value;
    }

    private String uniqueSlug(String title) {
        String slug = Slugs.fromTitle(title);
        while (setId(slug) != null) slug = Slugs.fromTitle(title);
        return slug;
    }

    private String setId(String slug) {
        List<String> ids = jdbc.queryForList("select \"id\" from \"VocabularySet\" where \"slug\" = ?", String.class, slug);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private String teacherId(String teacherId, String email) {
        String id = nullableTeacherId(teacherId, email);
        if (id == null) throw new IllegalStateException("Teacher account not found");
        return id;
    }

    private String nullableTeacherId(String teacherId, String email) {
        if (teacherId != null && !teacherId.isBlank()) return teacherId;
        if (email != null && !email.isBlank()) {
            List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" in ('TEACHER'::\"Role\", 'ADMIN'::\"Role\")", String.class, email);
            if (!ids.isEmpty()) return ids.get(0);
        }
        List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'TEACHER'::\"Role\" order by \"createdAt\" limit 1", String.class);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private String studentId(String studentId, String email) {
        if (studentId != null && !studentId.isBlank()) return studentId;
        if (email != null && !email.isBlank()) {
            List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" = 'STUDENT'::\"Role\"", String.class, email);
            if (!ids.isEmpty()) return ids.get(0);
        }
        List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'STUDENT'::\"Role\" order by \"createdAt\" limit 1", String.class);
        if (ids.isEmpty()) throw new IllegalStateException("Student account not found");
        return ids.get(0);
    }

    private String searchPattern(String value) {
        String normalized = queryText(value);
        return normalized == null ? null : "%" + normalized.toLowerCase() + "%";
    }

    private String queryText(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String status(String value) {
        if (value == null || value.isBlank()) return "DRAFT";
        String upper = value.trim().toUpperCase();
        return "PUBLISHED".equals(upper) ? "PUBLISHED" : "DRAFT";
    }

    private Timestamp timestamp(Object value) {
        String text = str(value);
        if (text == null || text.isBlank()) return null;
        try {
            if (text.endsWith("Z") || text.contains("+")) {
                return Timestamp.from(Instant.parse(text));
            }
            return Timestamp.valueOf(text.replace("T", " ") + (text.length() == 16 ? ":00" : ""));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Deadline is not in a supported datetime format");
        }
    }

    private int boundedInt(Object value, int fallback, int min, int max) {
        int parsed = fallback;
        if (value instanceof Number number) {
            parsed = number.intValue();
        } else {
            try {
                parsed = value == null ? fallback : Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                parsed = fallback;
            }
        }
        return Math.max(min, Math.min(max, parsed));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String iso(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }
}

