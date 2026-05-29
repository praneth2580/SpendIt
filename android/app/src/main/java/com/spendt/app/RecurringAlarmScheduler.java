package com.spendt.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public final class RecurringAlarmScheduler {

    private static final String ACTION_ALARM = "com.spendt.app.RECURRING_DUE";
    private static final int REQUEST_CODE_BASE = 80_000;
    /** Minimum gap between native reminders for the same overdue rule */
    private static final long OVERDUE_SNOOZE_MS = 12L * 60L * 60L * 1000L;

    private RecurringAlarmScheduler() {}

    public static void rescheduleAll(Context context) {
        cancelAll(context);
        String mode = SpendtPrefs.getRecurringApplyMode(context);
        if ("auto".equals(mode)) return;

        try {
            JSONArray rules = new JSONArray(SpendtPrefs.getRecurringRulesJson(context));
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            long now = System.currentTimeMillis();
            for (int i = 0; i < rules.length(); i++) {
                JSONObject rule = rules.getJSONObject(i);
                if (!rule.optBoolean("active", true)) continue;
                String ruleId = rule.optString("id", "");
                if (ruleId.isEmpty()) continue;

                long nextRun = parseIsoMillis(rule.optString("nextRunAt", ""));
                if (nextRun <= 0) continue;

                long trigger = nextRun;
                if (nextRun <= now) {
                    long lastNotified = SpendtPrefs.getRecurringLastNotified(context, ruleId);
                    long snoozeUntil = lastNotified > 0 ? lastNotified + OVERDUE_SNOOZE_MS : now + 5_000L;
                    trigger = Math.max(now + 5_000L, snoozeUntil);
                }
                PendingIntent pi = alarmIntent(context, ruleId, i);
                schedule(am, trigger, pi);
            }
        } catch (Exception ignored) {
            // malformed JSON — skip
        }
    }

    private static void schedule(AlarmManager am, long triggerAt, PendingIntent pi) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
                } else {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
                }
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception ignored) {
            am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    public static void cancelAll(Context context) {
        try {
            JSONArray rules = new JSONArray(SpendtPrefs.getRecurringRulesJson(context));
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            for (int i = 0; i < rules.length(); i++) {
                String ruleId = rules.getJSONObject(i).optString("id", "");
                if (!ruleId.isEmpty()) {
                    am.cancel(alarmIntent(context, ruleId, i));
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static PendingIntent alarmIntent(Context context, String ruleId, int index) {
        Intent intent = new Intent(context, RecurringAlarmReceiver.class);
        intent.setAction(ACTION_ALARM);
        intent.putExtra("ruleId", ruleId);
        int requestCode = REQUEST_CODE_BASE + (Math.abs(ruleId.hashCode()) % 10_000) + index;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }

    static long parseIsoMillis(String iso) {
        if (iso == null || iso.isEmpty()) return -1;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                return java.time.Instant.parse(iso).toEpochMilli();
            }
        } catch (Exception ignored) {
            // fall through — offset or legacy formats
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                return java.time.OffsetDateTime.parse(iso).toInstant().toEpochMilli();
            } catch (Exception ignored) {
                // fall through
            }
            try {
                return java.time.ZonedDateTime.parse(iso).toInstant().toEpochMilli();
            } catch (Exception ignored) {
                // fall through
            }
        }
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                java.util.Locale.US
            );
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            java.util.Date parsed = sdf.parse(iso);
            return parsed != null ? parsed.getTime() : -1;
        } catch (Exception e) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                    java.util.Locale.US
                );
                sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                java.util.Date parsed = sdf.parse(iso);
                return parsed != null ? parsed.getTime() : -1;
            } catch (Exception e2) {
                return -1;
            }
        }
    }
}
