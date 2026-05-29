package com.spendt.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import com.getcapacitor.JSObject;

public class UpiSmsReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null || pdus.length == 0) return;

        String format = bundle.getString("format");
        StringBuilder body = new StringBuilder();
        String sender = "";

        for (Object pdu : pdus) {
            SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, format);
            if (sms == null) continue;
            if (sender.isEmpty()) {
                String address = sms.getDisplayOriginatingAddress();
                sender = address != null ? address : "";
            }
            String part = sms.getMessageBody();
            if (part != null) body.append(part);
        }

        if (body.length() == 0) return;

        long timestamp = System.currentTimeMillis();
        JSObject payload = new JSObject();
        payload.put("sender", sender);
        payload.put("body", body.toString());
        payload.put("timestamp", timestamp);

        Context appContext = context.getApplicationContext();
        UpiSmsPlugin plugin = UpiSmsPlugin.getInstance();
        boolean appVisible = plugin != null && plugin.isInForeground();

        if (plugin != null) {
            plugin.deliverSms(payload);
        } else {
            UpiSmsQueue.enqueue(appContext, payload);
        }

        if (!appVisible) {
            SpendtNotificationHelper.showUpiSms(appContext, sender, body.toString());
        }
    }
}
