package com.giasu.controller;

import com.giasu.common.ApiResponse;
import com.giasu.service.TestService;
import com.giasu.service.VocabularyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final TestService testService;
    private final VocabularyService vocabularyService;

    public StudentController(TestService testService, VocabularyService vocabularyService) {
        this.testService = testService;
        this.vocabularyService = vocabularyService;
    }

    @GetMapping("/tests")
    public ApiResponse<?> tests() {
        return ApiResponse.ok(testService.studentTests());
    }

    @GetMapping("/tests/{slug}")
    public ApiResponse<?> test(@PathVariable String slug) {
        Map<String, Object> test = testService.studentTest(slug);
        return test == null ? ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra") : ApiResponse.ok(test);
    }

    @PostMapping("/tests/{slug}/start")
    public ApiResponse<?> start(
        @PathVariable String slug,
        @RequestParam(required = false) String studentId,
        @RequestParam(required = false) String studentEmail
    ) {
        Map<String, Object> attempt = testService.start(slug, studentId, studentEmail);
        return attempt == null ? ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra") : ApiResponse.ok(attempt);
    }

    @PostMapping("/tests/{slug}/submit")
    public ApiResponse<?> submit(@PathVariable String slug, @RequestBody Map<String, Object> body) {
        Map<String, Object> result = testService.submit(slug, body);
        return result == null ? ApiResponse.fail("NOT_FOUND", "Khong tim thay bai kiem tra") : ApiResponse.ok(result);
    }

    @GetMapping("/history")
    public ApiResponse<?> history(
        @RequestParam(required = false) String studentId,
        @RequestParam(required = false) String studentEmail
    ) {
        return ApiResponse.ok(testService.history(studentId, studentEmail));
    }

    @GetMapping("/profile")
    public ApiResponse<?> profile(@RequestParam(required = false) String studentEmail) {
        return ApiResponse.ok(testService.profile(studentEmail));
    }

    @GetMapping("/vocabulary")
    public ApiResponse<?> vocabulary(
        @RequestParam(required = false) String studentId,
        @RequestParam(required = false) String studentEmail
    ) {
        return ApiResponse.ok(vocabularyService.studentAssignments(studentId, studentEmail));
    }
}
