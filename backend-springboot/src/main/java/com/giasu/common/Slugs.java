package com.giasu.common;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.regex.Pattern;

public final class Slugs {
    private static final Pattern NON_LATIN = Pattern.compile("[^a-z0-9\\s-]");
    private static final Pattern SPACES = Pattern.compile("[\\s-]+");

    private Slugs() {}

    public static String fromTitle(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT);
        String clean = NON_LATIN.matcher(normalized).replaceAll("").trim();
        String slug = SPACES.matcher(clean).replaceAll("-");
        if (slug.isBlank()) {
            slug = "bai-kiem-tra";
        }
        return slug + "-" + Instant.now().toEpochMilli();
    }
}
