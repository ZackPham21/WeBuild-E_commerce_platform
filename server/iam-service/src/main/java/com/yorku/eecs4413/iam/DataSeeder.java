package com.yorku.eecs4413.iam;


import com.yorku.eecs4413.iam.User;
import com.yorku.eecs4413.iam.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        seedUser("winner789", "WinPass!1",  "Alice",  "Winner", "1",  "Bay St",   "Toronto", "Canada", "M5J2T3");
        seedUser("loser456",  "LosePass!1", "Bob",    "Loser",  "2",  "Yonge St", "Toronto", "Canada", "M4W2G8");
        seedUser("seller1",   "SellerPass!1","Carol", "Seller", "10", "Queen St", "Toronto", "Canada", "M5H2M5");
        System.out.println("[IAM] Seed users created.");
    }

    private void seedUser(String username, String password,
                          String firstName, String lastName,
                          String streetNum, String streetName,
                          String city, String country, String postal) {
        if (!userRepository.existsByUsername(username)) {
            User u = new User();
            u.setUsername(username);
            u.setPasswordHash(encoder.encode(password));
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setStreetNumber(streetNum);
            u.setStreetName(streetName);
            u.setCity(city);
            u.setCountry(country);
            u.setPostalCode(postal);
            userRepository.save(u);
        }
    }
}