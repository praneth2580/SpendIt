package com.spendt.app;

import android.app.AlarmManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SpendtBackground")
public class SpendtBackgroundPlugin extends Plugin {

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(android.content.Context.ALARM_SERVICE);
            if (am != null && !am.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void syncRecurringSchedule(PluginCall call) {
        String rulesJson = call.getString("rulesJson", "[]");
        String applyMode = call.getString("applyMode", "smart");
        SpendtPrefs.saveRecurringRules(getContext(), rulesJson, applyMode);
        RecurringAlarmScheduler.rescheduleAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void syncSmsSettings(PluginCall call) {
        boolean autoImport = Boolean.TRUE.equals(call.getBoolean("smsAutoImport", false));
        String mode = call.getString("smsImportMode", "confirm");
        SpendtPrefs.saveSmsSettings(getContext(), autoImport, mode);
        call.resolve();
    }
}
