package com.yorku.eecs4413.iam;
import com.yorku.eecs4413.iam.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, String> {
    Optional<Session> findByToken(String token);
    void deleteByUserId(Long userId);
}
