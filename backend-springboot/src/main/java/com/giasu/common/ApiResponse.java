package com.giasu.common;

public record ApiResponse<T>(boolean success, T data, Object error) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorDto(code, message));
    }

    public record ErrorDto(String code, String message) {}
}
