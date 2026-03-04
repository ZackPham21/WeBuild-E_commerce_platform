package com.yorku.eecs4413.iam;



public class SessionValidationResponse {
    private boolean valid;
    private Long userId;
    private String username;

    public SessionValidationResponse(boolean valid, Long userId, String username) {
        this.valid = valid;
        this.userId = userId;
        this.username = username;
    }

    public boolean isValid() { return valid; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
}
