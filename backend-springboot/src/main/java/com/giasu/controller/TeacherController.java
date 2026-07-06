package com.giasu.controller;

import com.giasu.common.ApiResponse;
import com.giasu.service.TestService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/teachers")
public class TeacherController {
    private final TestService testService;

    public TeacherController(TestService testService) {
        this.testService = testService;
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

    @PostMapping("/tests")
    public ApiResponse<?> createTest(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(testService.createTest(body));
    }

    @PatchMapping("/tests/{slug}")
    public ApiResponse<?> updateTest(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> test = testService.updateTest(slug, body);
        return test == null ? ApiResponse.fail("NOT_FOUND", "Không tìm thấy bài kiểm tra") : ApiResponse.ok(test);
    }

    @DeleteMapping("/tests/{slug}")
    public ApiResponse<?> deleteTest(@PathVariable String slug) {
        return testService.deleteTest(slug)
            ? ApiResponse.ok(Map.of("deleted", true))
            : ApiResponse.fail("NOT_FOUND", "Không tìm thấy bài kiểm tra");
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
