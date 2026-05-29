package com.spendt.app;

import android.content.Context;
import android.content.SharedPreferences;

public final class SpendtPrefs {

    private static final String PREFS = "spendt_background";
    private static final String KEY_RULES_JSON = "recurring_rules_json";
    private static final String KEY_APPLY_MODE = "recurring_apply_mode";
    private static final String KEY_SMS_AUTO = "sms_auto_import";
    private static final String KEY_SMS_MODE = "sms_import_mode";
    private static final String KEY_RECURRING_NOTIFIED_PREFIX = "recurring_notified_";

    private SpendtPrefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void saveRecurringRules(Context context, String rulesJson, String applyMode) {
        prefs(context).edit()
            .putString(KEY_RULES_JSON, rulesJson != null ? rulesJson : "[]")
            .putString(KEY_APPLY_MODE, applyMode != null ? applyMode : "smart")
            .apply();
    }

    public static String getRecurringRulesJson(Context context) {
        return prefs(context).getString(KEY_RULES_JSON, "[]");
    }

    public static String getRecurringApplyMode(Context context) {
        return prefs(context).getString(KEY_APPLY_MODE, "smart");
    }

    public static void saveSmsSettings(Context context, boolean autoImport, String importMode) {
        prefs(context).edit()
            .putBoolean(KEY_SMS_AUTO, autoImport)
            .putString(KEY_SMS_MODE, importMode != null ? importMode : "confirm")
            .apply();
    }

    public static boolean isSmsAutoImport(Context context) {
        return prefs(context).getBoolean(KEY_SMS_AUTO, false);
    }

    public static String getSmsImportMode(Context context) {
        return prefs(context).getString(KEY_SMS_MODE, "confirm");
    }

    public static void markRecurringNotified(Context context, String ruleId, long atMillis) {
        if (ruleId == null || ruleId.isEmpty()) return;
        prefs(context).edit().putLong(KEY_RECURRING_NOTIFIED_PREFIX + ruleId, atMillis).apply();
    }

    public static long getRecurringLastNotified(Context context, String ruleId) {
        if (ruleId == null || ruleId.isEmpty()) return 0L;
        return prefs(context).getLong(KEY_RECURRING_NOTIFIED_PREFIX + ruleId, 0L);
    }
}
