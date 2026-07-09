package com.giasu.controller;

import com.giasu.common.ApiResponse;
import com.giasu.service.FoundationCourseService;
import com.giasu.service.TestService;
import com.giasu.service.VocabularyService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teachers")
public class TeacherController {
    private final TestService testService;
    private final VocabularyService vocabularyService;
    private final FoundationCourseService foundationCourseService;

    public TeacherController(TestService testService, VocabularyService vocabularyService, FoundationCourseService foundationCourseService) {
        this.testService = testService;
        this.vocabularyService = vocabularyService;
        this.foundationCourseService = foundationCourseService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<?> dashboard(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(testService.dashboard(teacherId, teacherEmail, admin));
    }

    @GetMapping("/tests")
    public ApiResponse<?> tests(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(testService.teacherTests(teacherId, teacherEmail, admin));
    }

    @GetMapping("/tests/{slug}")
    public ApiResponse<?> test(@PathVariable String slug) {
        Map<String, Object> test = testService.teacherTest(slug);
        return test == null ? ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra") : ApiResponse.ok(test);
    }

    @PostMapping("/tests")
    public ApiResponse<?> createTest(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(testService.createTest(body));
    }

    @PatchMapping("/tests/{slug}")
    public ApiResponse<?> updateTest(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> test = testService.updateTest(slug, body);
        return test == null ? ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra") : ApiResponse.ok(test);
    }

    @DeleteMapping("/tests/{slug}")
    public ApiResponse<?> deleteTest(@PathVariable String slug) {
        return testService.deleteTest(slug)
            ? ApiResponse.ok(Map.of("deleted", true))
            : ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra");
    }

    @GetMapping("/classes")
    public ApiResponse<?> classes(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(testService.classes(teacherId, teacherEmail, admin));
    }

    @PostMapping("/classes")
    public ApiResponse<?> createClass(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(testService.createClass(body));
    }

    @GetMapping("/vocabulary")
    public ApiResponse<?> vocabularySets(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(vocabularyService.teacherSets(teacherId, teacherEmail, admin));
    }

    @GetMapping("/vocabulary/audience")
    public ApiResponse<?> vocabularyAudience(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(vocabularyService.assignmentAudience(teacherId, teacherEmail, admin));
    }

    @GetMapping("/vocabulary/{slug}")
    public ApiResponse<?> vocabularySet(@PathVariable String slug) {
        Map<String, Object> set = vocabularyService.teacherSet(slug);
        return set == null ? ApiResponse.fail("NOT_FOUND", "Vocabulary set not found") : ApiResponse.ok(set);
    }

    @GetMapping("/vocabulary/{slug}/items")
    public ApiResponse<?> vocabularyItems(
        @PathVariable String slug,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "5") int pageSize,
        @RequestParam(required = false) String query
    ) {
        Map<String, Object> payload = vocabularyService.teacherItems(slug, page, pageSize, query);
        return payload == null ? ApiResponse.fail("NOT_FOUND", "Vocabulary set not found") : ApiResponse.ok(payload);
    }

    @GetMapping("/vocabulary/{slug}/assignments")
    public ApiResponse<?> vocabularyAssignments(@PathVariable String slug) {
        return ApiResponse.ok(vocabularyService.teacherAssignments(slug));
    }

    @GetMapping("/vocabulary/{slug}/assignments/{assignmentId}/progress")
    public ApiResponse<?> vocabularyAssignmentProgress(@PathVariable String slug, @PathVariable String assignmentId) {
        return ApiResponse.ok(vocabularyService.teacherAssignmentProgress(slug, assignmentId));
    }

    @PostMapping("/vocabulary")
    public ApiResponse<?> createVocabularySet(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(vocabularyService.createSet(body));
    }

    @PatchMapping("/vocabulary/{slug}")
    public ApiResponse<?> updateVocabularySet(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> set = vocabularyService.updateSet(slug, body);
        return set == null ? ApiResponse.fail("NOT_FOUND", "Vocabulary set not found") : ApiResponse.ok(set);
    }

    @PostMapping("/vocabulary/{slug}/items")
    public ApiResponse<?> createVocabularyItem(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> item = vocabularyService.createItem(slug, body);
        return item == null ? ApiResponse.fail("NOT_FOUND", "Vocabulary set not found") : ApiResponse.ok(item);
    }

    @PatchMapping("/vocabulary/{slug}/items/{itemId}")
    public ApiResponse<?> updateVocabularyItem(@PathVariable String slug, @PathVariable String itemId, @RequestBody Map<String, Object> body) {
        Map<String, Object> item = vocabularyService.updateItem(slug, itemId, body);
        return item == null ? ApiResponse.fail("NOT_FOUND", "Vocabulary item not found") : ApiResponse.ok(item);
    }

    @PostMapping("/vocabulary/{slug}/assignments")
    public ApiResponse<?> createVocabularyAssignments(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        List<Map<String, Object>> items = vocabularyService.createAssignments(slug, body);
        return items.isEmpty() ? ApiResponse.fail("NOT_FOUND", "Vocabulary set not found") : ApiResponse.ok(items);
    }

    @DeleteMapping("/vocabulary/{slug}/items/{itemId}")
    public ApiResponse<?> deleteVocabularyItem(@PathVariable String slug, @PathVariable String itemId) {
        return vocabularyService.deleteItem(slug, itemId)
            ? ApiResponse.ok(Map.of("deleted", true))
            : ApiResponse.fail("NOT_FOUND", "Vocabulary item not found");
    }
    @GetMapping("/foundation-courses")
    public ApiResponse<?> foundationCourses(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(foundationCourseService.teacherCourses(teacherId, teacherEmail, admin));
    }

    @GetMapping("/foundation-courses/{slug}")
    public ApiResponse<?> foundationCourse(@PathVariable String slug) {
        Map<String, Object> course = foundationCourseService.teacherCourse(slug);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation course not found") : ApiResponse.ok(course);
    }

    @PostMapping("/foundation-courses")
    public ApiResponse<?> createFoundationCourse(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(foundationCourseService.createCourse(body));
    }

    @PatchMapping("/foundation-courses/{slug}")
    public ApiResponse<?> updateFoundationCourse(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.updateCourse(slug, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation course not found") : ApiResponse.ok(course);
    }

    @PostMapping("/foundation-courses/{slug}/units")
    public ApiResponse<?> createFoundationUnit(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.createUnit(slug, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation course not found") : ApiResponse.ok(course);
    }

    @PatchMapping("/foundation-units/{unitId}")
    public ApiResponse<?> updateFoundationUnit(@PathVariable String unitId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.updateUnit(unitId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation unit not found") : ApiResponse.ok(course);
    }

    @PostMapping("/foundation-units/{unitId}/lessons")
    public ApiResponse<?> createFoundationLesson(@PathVariable String unitId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.createLesson(unitId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation unit not found") : ApiResponse.ok(course);
    }

    @PatchMapping("/foundation-lessons/{lessonId}")
    public ApiResponse<?> updateFoundationLesson(@PathVariable String lessonId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.updateLesson(lessonId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation lesson not found") : ApiResponse.ok(course);
    }

    @PostMapping("/foundation-lessons/{lessonId}/blocks")
    public ApiResponse<?> createFoundationLessonBlock(@PathVariable String lessonId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.createBlock(lessonId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation lesson not found") : ApiResponse.ok(course);
    }

    @PatchMapping("/foundation-lessons/{lessonId}/blocks/reorder")
    public ApiResponse<?> reorderFoundationLessonBlocks(@PathVariable String lessonId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.reorderBlocks(lessonId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation lesson not found") : ApiResponse.ok(course);
    }

    @PatchMapping("/foundation-blocks/{blockId}")
    public ApiResponse<?> updateFoundationLessonBlock(@PathVariable String blockId, @RequestBody Map<String, Object> body) {
        Map<String, Object> course = foundationCourseService.updateBlock(blockId, body);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation lesson block not found") : ApiResponse.ok(course);
    }

    @DeleteMapping("/foundation-blocks/{blockId}")
    public ApiResponse<?> deleteFoundationLessonBlock(@PathVariable String blockId) {
        Map<String, Object> course = foundationCourseService.deleteBlock(blockId);
        return course == null ? ApiResponse.fail("NOT_FOUND", "Foundation lesson block not found") : ApiResponse.ok(course);
    }
    @GetMapping("/questions")
    public ApiResponse<?> questions(
        @RequestParam(required = false) String teacherId,
        @RequestParam(required = false) String teacherEmail,
        @RequestParam(defaultValue = "false") boolean admin
    ) {
        return ApiResponse.ok(testService.questions(teacherId, teacherEmail, admin));
    }

    @PostMapping("/questions")
    public ApiResponse<?> createQuestion(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(testService.createQuestion(body));
    }
}
