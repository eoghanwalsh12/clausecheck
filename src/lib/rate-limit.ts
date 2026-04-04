const rateMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  rateMap.forEach((val, key) => {
    if (now > val.resetTime) {
      rateMap.delete(key);
    }
  });
}, 60_000);

/**
 * Simple in-memory sliding-window rate limiter.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(
  token: string,
  limit: number,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateMap.get(token);

  if (!entry || now > entry.resetTime) {
    rateMap.set(token, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}
