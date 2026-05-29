package com.spendt.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Re-schedule recurring alarms after device reboot. */
public class RecurringBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        RecurringAlarmScheduler.rescheduleAll(context);
    }
}
