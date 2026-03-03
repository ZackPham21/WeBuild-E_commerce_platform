package com.yorku.eecs4413.iam.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.yorku.eecs4413.iam.application.AccountService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse signup(@Valid @RequestBody SignupRequest req) {
        return service.signup(req);
    }

    @PostMapping("/signin")
    public AccountResponse signin(@Valid @RequestBody SigninRequest req) {
        return service.signin(req);
    }
}