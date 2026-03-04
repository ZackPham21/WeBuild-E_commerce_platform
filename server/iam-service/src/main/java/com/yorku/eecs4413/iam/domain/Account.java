package com.yorku.eecs4413.iam.domain;

public class Account {

    private final String id;
    private final String email;
    private final String passwordHash;

    public Account(String id, String email, String passwordHash) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
}