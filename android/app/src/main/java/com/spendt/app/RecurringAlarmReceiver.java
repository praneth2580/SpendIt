package com.spendt.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;

public class RecurringAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String ruleId = intent.getStringExtra("ruleId");
        if (ruleId == null || ruleId.isEmpty()) return;

        String mode = SpendtPrefs.getRecurringApplyMode(context);
        if ("auto".equals(mode)) return;

        try {
            JSONArray rules = new JSONArray(SpendtPrefs.getRecurringRulesJson(context));
            for (int i = 0; i < rules.length(); i++) {
                JSONObject rule = rules.getJSONObject(i);
                if (!ruleId.equals(rule.optString("id"))) continue;
                if (!rule.optBoolean("active", true)) return;

                String name = rule.optString("name", "Recurring payment");
                double amount = rule.optDouble("amount", 0);
                String type = rule.optString("type", "expense");
                String amountLabel = formatAmount(amount, type);

                SpendtNotificationHelper.showRecurringDue(
                    context,
                    ruleId,
                    "Confirm recurring payment",
                    name + " · " + amountLabel + " is due. Tap to review."
                );
                SpendtPrefs.markRecurringNotified(context, ruleId, System.currentTimeMillis());
                RecurringAlarmScheduler.rescheduleAll(context);
                return;
            }
        } catch (Exception ignored) {
            SpendtNotificationHelper.showRecurringDue(
                context,
                ruleId,
                "Recurring payment due",
                "Tap to review and confirm."
            );
        }
    }

    private static String formatAmount(double amount, String type) {
        if ("transfer".equals(type)) {
            return "₹" + formatNumber(amount);
        }
        if ("expense".equals(type)) {
            return "-₹" + formatNumber(amount);
        }
        return "+₹" + formatNumber(amount);
    }

    private static String formatNumber(double value) {
        if (value == (long) value) {
            return String.valueOf((long) value);
        }
        return String.format(java.util.Locale.US, "%.2f", value);
    }
}
