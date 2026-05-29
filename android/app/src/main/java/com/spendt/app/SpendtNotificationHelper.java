package com.spendt.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public final class SpendtNotificationHelper {

    public static final String CHANNEL_RECURRING = "recurring-payments";
    public static final String CHANNEL_UPI = "upi-sms";
    private static final int NOTIF_RECURRING_BASE = 70_000;
    private static final int NOTIF_UPI = 71_000;

    private SpendtNotificationHelper() {}

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel recurring = new NotificationChannel(
            CHANNEL_RECURRING,
            "Recurring payments",
            NotificationManager.IMPORTANCE_HIGH
        );
        recurring.setDescription("Due recurring payments that need confirmation");
        recurring.enableVibration(true);
        nm.createNotificationChannel(recurring);

        NotificationChannel upi = new NotificationChannel(
            CHANNEL_UPI,
            "UPI / bank SMS",
            NotificationManager.IMPORTANCE_HIGH
        );
        upi.setDescription("Payment SMS detected — tap to review");
        upi.enableVibration(true);
        nm.createNotificationChannel(upi);
    }

    private static PendingIntent deepLink(Context context, String path, int requestCode) {
        String scheme = context.getString(R.string.custom_url_scheme);
        Uri uri = Uri.parse(scheme + "://app" + path);
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.setClass(context, MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    public static void showRecurringDue(Context context, String ruleId, String title, String body) {
        ensureChannels(context);
        int id = NOTIF_RECURRING_BASE + (Math.abs(ruleId.hashCode()) % 8_000);
        String path = "/?recurringRule=" + Uri.encode(ruleId);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_RECURRING)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(deepLink(context, path, id));
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(id, builder.build());
    }

    public static void showUpiSms(Context context, String sender, String bodyPreview) {
        if (!SpendtPrefs.isSmsAutoImport(context)) return;
        if ("auto".equals(SpendtPrefs.getSmsImportMode(context))) return;

        ensureChannels(context);
        String preview = bodyPreview.length() > 120 ? bodyPreview.substring(0, 117) + "…" : bodyPreview;
        String title = "UPI / bank payment detected";
        String text = (sender != null && !sender.isEmpty() ? sender + " — " : "") + preview;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_UPI)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(deepLink(context, "/add-expense", NOTIF_UPI));
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIF_UPI, builder.build());
    }
}
