package com.campusfind.utils;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding window rate limiter for login attempts.
 * Limits failed login attempts per client IP within a rolling time window.
 * Once the threshold is tripped, all login attempts from that IP (whether credentials are valid or not)
 * are rejected with HTTP 429 until the window clears.
 * A successful login clears the failed attempt history for that IP.
 */
public class LoginRateLimiter {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final long DEFAULT_WINDOW_MILLIS = 15 * 60 * 1000L; // 15 minutes

    private static final LoginRateLimiter INSTANCE = new LoginRateLimiter();

    private final long windowMillis;
    private final ConcurrentHashMap<String, Deque<Long>> failureRecords = new ConcurrentHashMap<>();

    public LoginRateLimiter() {
        this(DEFAULT_WINDOW_MILLIS);
    }

    public LoginRateLimiter(long windowMillis) {
        this.windowMillis = windowMillis;
    }

    public static LoginRateLimiter getInstance() {
        return INSTANCE;
    }

    /**
     * Checks if the given client IP has exceeded the allowed failed attempts threshold within the rolling window.
     *
     * @param clientIp the remote IP of the caller
     * @return true if the client is rate-limited (blocked), false otherwise
     */
    public boolean isRateLimited(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return false;
        }

        long now = Instant.now().toEpochMilli();
        long windowStart = now - windowMillis;

        Deque<Long> attempts = failureRecords.get(clientIp);
        if (attempts == null) {
            return false;
        }

        synchronized (attempts) {
            cleanExpired(attempts, windowStart);
            return attempts.size() >= MAX_FAILED_ATTEMPTS;
        }
    }

    /**
     * Records a failed login attempt for the given client IP.
     *
     * @param clientIp the remote IP of the caller
     */
    public void recordFailure(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return;
        }

        long now = Instant.now().toEpochMilli();
        long windowStart = now - windowMillis;

        failureRecords.compute(clientIp, (ip, deque) -> {
            Deque<Long> attempts = (deque != null) ? deque : new ArrayDeque<>();
            synchronized (attempts) {
                cleanExpired(attempts, windowStart);
                attempts.addLast(now);
            }
            return attempts;
        });
    }

    /**
     * Resets the failure counter for the given client IP upon a successful login.
     *
     * @param clientIp the remote IP of the caller
     */
    public void recordSuccess(String clientIp) {
        if (clientIp != null && !clientIp.isBlank()) {
            failureRecords.remove(clientIp);
        }
    }

    /**
     * Clears all recorded attempts (useful for testing).
     */
    public void clearAll() {
        failureRecords.clear();
    }

    private void cleanExpired(Deque<Long> attempts, long windowStart) {
        while (!attempts.isEmpty() && attempts.peekFirst() < windowStart) {
            attempts.pollFirst();
        }
    }
}

