package com.spendt.app;

import android.Manifest;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "UpiSms",
    permissions = {
        @Permission(strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS }, alias = UpiSmsPlugin.SMS)
    }
)
public class UpiSmsPlugin extends Plugin {

    static final String SMS = "sms";
    private static UpiSmsPlugin instance;
    private boolean inForeground = true;

    @Override
    public void load() {
        super.load();
        instance = this;
        flushQueue();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        inForeground = true;
    }

    @Override
    protected void handleOnPause() {
        inForeground = false;
        super.handleOnPause();
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.handleOnDestroy();
    }

    public static UpiSmsPlugin getInstance() {
        return instance;
    }

    public boolean isInForeground() {
        return inForeground;
    }

    public void deliverSms(JSObject payload) {
        notifyListeners("upiSmsReceived", payload);
    }

    private void flushQueue() {
        for (JSObject item : UpiSmsQueue.drain(getContext())) {
            notifyListeners("upiSmsReceived", item);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put(SMS, getSmsPermissionState());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getSmsPermissionState().equals("granted")) {
            JSObject result = new JSObject();
            result.put(SMS, "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias(SMS, call, "smsPermsCallback");
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put(SMS, getSmsPermissionState());
        call.resolve(result);
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSArray messages = new JSArray();
        for (JSObject item : UpiSmsQueue.drain(getContext())) {
            messages.put(item);
        }
        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }

    private String getSmsPermissionState() {
        PermissionState receive = getPermissionState(SMS);
        if (receive == PermissionState.GRANTED) {
            return "granted";
        }
        if (receive == PermissionState.DENIED) {
            return "denied";
        }
        return "prompt";
    }
}
