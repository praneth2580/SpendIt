package com.spendt.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class UpiSmsQueue {
    private static final String PREFS = "upi_sms_queue";
    private static final String KEY = "messages";

    private UpiSmsQueue() {}

    public static void enqueue(Context context, JSObject message) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Set<String> existing = new HashSet<>(prefs.getStringSet(KEY, new HashSet<>()));
        String encoded = message.toString();
        if (existing.contains(encoded)) return;
        existing.add(encoded);
        prefs.edit().putStringSet(KEY, existing).apply();
    }

    public static List<JSObject> drain(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Set<String> existing = prefs.getStringSet(KEY, new HashSet<>());
        List<JSObject> result = new ArrayList<>();
        if (existing == null || existing.isEmpty()) return result;

        for (String encoded : existing) {
            try {
                JSONObject json = new JSONObject(encoded);
                JSObject obj = new JSObject();
                obj.put("sender", json.optString("sender", ""));
                obj.put("body", json.optString("body", ""));
                obj.put("timestamp", json.optLong("timestamp", System.currentTimeMillis()));
                result.add(obj);
            } catch (JSONException ignored) {
                // skip malformed entries
            }
        }

        prefs.edit().remove(KEY).apply();
        return result;
    }
}
