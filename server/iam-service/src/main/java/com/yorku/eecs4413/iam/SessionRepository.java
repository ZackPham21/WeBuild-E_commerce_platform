package com.yorku.eecs4413.iam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, String> {
    Optional<Session> findByToken(String token);
    void deleteByUserId(Long userId);
}
