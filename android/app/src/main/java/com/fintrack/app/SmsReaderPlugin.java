package com.fintrack.app;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
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
    name = "SmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS }
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void getRecentSms(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        } else {
            loadSms(call);
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            loadSms(call);
        } else {
            call.reject("Permission to read SMS was denied");
        }
    }

    private void loadSms(PluginCall call) {
        int limit = call.getInt("limit", 100);
        JSArray smsList = new JSArray();

        try {
            Uri uri = Uri.parse("content://sms/inbox");
            String[] projection = new String[] { "_id", "address", "body", "date" };
            Cursor cursor = getContext().getContentResolver().query(
                uri,
                projection,
                null,
                null,
                "date DESC LIMIT " + limit
            );

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    JSObject item = new JSObject();
                    item.put("id", cursor.getString(cursor.getColumnIndexOrThrow("_id")));
                    item.put("sender", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    item.put("body", cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    item.put("date", cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                    smsList.put(item);
                } while (cursor.moveToNext());
                cursor.close();
            }

            JSObject ret = new JSObject();
            ret.put("messages", smsList);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to query SMS: " + e.getMessage());
        }
    }
}
