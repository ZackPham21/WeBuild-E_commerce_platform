package com.yorku.eecs4413.iam.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SigninRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {}