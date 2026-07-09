package com.giasu.service;

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

    public FoundationCourseService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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

    private void upsertProgress(String studentId, String courseId, String lessonId, String status) {
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
        row.put("startedAt", iso(rs.getTimestamp("startedAt"))); row.put("completedAt", iso(rs.getTimestamp("completedAt")));
        return row;
    }

    private Map<String, Object> progressRow(String studentId, String lessonId) {
        return jdbc.queryForObject("select \"lessonId\", \"status\", \"startedAt\", \"completedAt\" from \"FoundationLessonProgress\" where \"studentId\" = ? and \"lessonId\" = ?", (rs, i) -> {
            Map<String, Object> row = new LinkedHashMap<>(); row.put("lessonId", rs.getString("lessonId")); row.put("status", rs.getString("status")); row.put("startedAt", iso(rs.getTimestamp("startedAt"))); row.put("completedAt", iso(rs.getTimestamp("completedAt"))); return row;
        }, studentId, lessonId);
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
    private int nextUnitOrder(String courseId) { Integer v = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"FoundationUnit\" where \"courseId\" = ?", Integer.class, courseId); return v == null ? 0 : v; }
    private int nextLessonOrder(String unitId) { Integer v = jdbc.queryForObject("select coalesce(max(\"orderIndex\"), -1) + 1 from \"FoundationLesson\" where \"unitId\" = ?", Integer.class, unitId); return v == null ? 0 : v; }
    private String teacherId(String teacherId, String email) { if (teacherId != null && !teacherId.isBlank()) return teacherId; if (email != null && !email.isBlank()) { List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" in ('TEACHER'::\"Role\", 'ADMIN'::\"Role\")", String.class, email); if (!ids.isEmpty()) return ids.get(0); } List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'TEACHER'::\"Role\" order by \"createdAt\" limit 1", String.class); if (ids.isEmpty()) throw new IllegalStateException("Teacher not found"); return ids.get(0); }
    private String studentId(String studentId, String email) { if (studentId != null && !studentId.isBlank()) return studentId; List<String> ids = jdbc.queryForList("select \"id\" from \"User\" where \"email\" = ? and \"role\" = 'STUDENT'::\"Role\"", String.class, text(email, "student@example.com")); if (!ids.isEmpty()) return ids.get(0); ids = jdbc.queryForList("select \"id\" from \"User\" where \"role\" = 'STUDENT'::\"Role\" order by \"createdAt\" limit 1", String.class); if (ids.isEmpty()) throw new IllegalStateException("Student not found"); return ids.get(0); }
    private String status(String value, String fallback) { if (value == null || value.isBlank()) return fallback; String v = value.toUpperCase(); return v.equals("PUBLISHED") ? "PUBLISHED" : v.equals("DRAFT") ? "DRAFT" : fallback; }
    private String str(Object value) { return value == null ? null : String.valueOf(value); }
    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private String blankToNull(String value, boolean blankIsNull) { return value == null || (blankIsNull && value.isBlank()) ? null : value; }
    private int intVal(Object value, int fallback) { Integer v = nullableInt(value); return v == null ? fallback : v; }
    private Integer nullableInt(Object value) { if (value == null || String.valueOf(value).isBlank()) return null; try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException e) { return null; } }
    private String iso(Timestamp value) { return value == null ? null : value.toInstant().toString(); }
}
