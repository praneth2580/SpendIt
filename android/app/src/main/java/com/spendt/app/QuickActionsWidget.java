package com.spendt.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class QuickActionsWidget extends AppWidgetProvider {
    private PendingIntent buildDeepLink(Context context, String path) {
        String scheme = context.getString(R.string.custom_url_scheme);
        Uri uri = Uri.parse(scheme + "://app" + path);

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, path.hashCode(), intent, flags);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.spendt_widget_quick_actions);

            views.setOnClickPendingIntent(R.id.widget_add_expense, buildDeepLink(context, "/add?type=expense"));
            views.setOnClickPendingIntent(R.id.widget_add_income, buildDeepLink(context, "/add?type=income"));
            views.setOnClickPendingIntent(R.id.widget_add_transfer, buildDeepLink(context, "/add?type=transfer"));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}

