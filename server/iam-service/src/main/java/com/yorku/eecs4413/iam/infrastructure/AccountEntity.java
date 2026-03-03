package com.yorku.eecs4413.iam.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_accounts_email", columnNames = "email")
})
public class AccountEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 64)
    private String passwordHash;

    protected AccountEntity() { } // JPA

    public AccountEntity(String id, String email, String passwordHash) {
        this.id = id;
        this.email = email.toLowerCase();
        this.passwordHash = passwordHash;
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
}