# Phase 1: Project Setup + Auth

## Project Initialization

Generate a Spring Boot project (Java 17+, Maven) or create manually with this `pom.xml`:

### Dependencies
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.6</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

### application.properties
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/artistbooth
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

jwt.secret=<generate-a-base64-encoded-256-bit-key>
jwt.expiration=86400000

server.port=8080
```

## Package Structure
```
src/main/java/com/artistbooth/
  ArtistBoothApplication.java
  config/
    SecurityConfig.java
    JwtAuthFilter.java
    CorsConfig.java
  controller/
  dto/
  entity/
  repository/
  service/
```

---

## Auth Implementation

### 1. User Entity
```java
@Entity @Table(name = "users")
public class User implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;  // bcrypt hash

    private String name;

    private LocalDateTime createdAt;

    // UserDetails methods:
    // getAuthorities() → empty list
    // getUsername() → return email
    // isAccountNonExpired/Locked/CredentialsNonExpired/isEnabled → return true
}
```

### 2. UserRepository
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### 3. DTOs
```java
// SignupRequest
{ String email, String password, String name }

// LoginRequest
{ String email, String password }

// AuthResponse
{ String token, Long userId, String email }
```

### 4. JwtService
- `generateToken(User user)` — creates JWT with HS256, userId as subject, 24h expiry
- `extractUserId(String token)` — parses and returns subject
- `isTokenValid(String token)` — checks signature + expiration

### 5. AuthService
- `signup(SignupRequest req)`:
  1. Check `existsByEmail` → throw if taken
  2. Hash password with `BCryptPasswordEncoder`
  3. Save User
  4. Generate + return JWT
- `login(LoginRequest req)`:
  1. Find by email → throw if not found
  2. Verify password with BCrypt `matches()`
  3. Generate + return JWT

### 6. AuthController — `/api/v1/auth`
| Method | Path | Body | Response |
|--------|------|------|---------|
| POST | `/signup` | `{email, password, name}` | `{token, userId, email}` |
| POST | `/login` | `{email, password}` | `{token, userId, email}` |

### 7. SecurityConfig
```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/auth/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

### 8. JwtAuthFilter (extends OncePerRequestFilter)
1. Read `Authorization: Bearer <token>` header
2. Extract userId via JwtService
3. Load User from DB
4. Set `UsernamePasswordAuthenticationToken` in SecurityContext
5. If token missing/invalid → pass through (Spring Security rejects unauthenticated)

### 9. CorsConfig
Allow origins: `http://localhost:8081`, `http://localhost:19006` (Expo dev servers)

---

## Status: COMPLETE (2026-04-18)

### What was done
- [x] Install PostgreSQL 17 and add `bin` to PATH
- [x] Create the database: `createdb artistbooth`
- [x] Add jjwt dependencies to `pom.xml` (jjwt-api, jjwt-impl, jjwt-jackson v0.12.6)
- [x] Fix UserRepository (was missing JpaRepository extension and had wrong imports)
- [x] Run the app: `cd backend && ./mvnw spring-boot:run`
- [x] Confirm app starts without errors and `users` table is auto-created
- [x] Test signup — returns `{token, userId, email}` ✓
- [x] Test login — returns `{token, userId, email}` ✓

### Notes
- PostgreSQL password is `123` (set in `application.properties`)
- PostgreSQL bin path: `C:\Program Files\PostgreSQL\17\bin`

### Next step
Wire up auth (login/signup) on the frontend, then move to Phase 2 (Inventory API).
