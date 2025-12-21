package com.pixeltales.app;

import android.content.Context;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;
import java.util.Set;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@CapacitorPlugin(name = "AndroidTtsVoices")
public class AndroidTtsVoicesPlugin extends Plugin {

    private TextToSpeech tts;

    @Override
    public void load() {
        super.load();
        initTts();
    }

    private void initTts() {
        Context ctx = getContext();
        if (ctx == null) return;

        tts = new TextToSpeech(ctx, status -> {
            // no-op
        });
    }

    @PluginMethod
    public void getInstalledVoices(PluginCall call) {
        final boolean localOnly = call.getBoolean("localOnly", true);

        if (tts == null) {
            initTts();
        }

        if (tts == null) {
            call.reject("TextToSpeech not available");
            return;
        }

        JSArray voicesArr = new JSArray();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // IMPORTANT: Convert to a stable *ordered* list so we can provide consistent indices
                Set<Voice> voices = tts.getVoices();
                if (voices != null) {
                    List<Voice> voiceList = new ArrayList<>(voices);
                    Collections.sort(voiceList, new Comparator<Voice>() {
                        @Override
                        public int compare(Voice a, Voice b) {
                            if (a == null && b == null) return 0;
                            if (a == null) return -1;
                            if (b == null) return 1;
                            String ak = (a.getLocale() != null ? a.getLocale().toLanguageTag() : "") + "|" + a.getName();
                            String bk = (b.getLocale() != null ? b.getLocale().toLanguageTag() : "") + "|" + b.getName();
                            return ak.compareTo(bk);
                        }
                    });

                    int index = 0;
                    for (Voice v : voiceList) {
                        if (v == null) continue;

                        Locale locale = v.getLocale();
                        String langTag = locale != null ? locale.toLanguageTag() : "";

                        boolean networkRequired = false;
                        try {
                            networkRequired = v.isNetworkConnectionRequired();
                        } catch (Throwable ignored) {
                            // Some devices may throw here
                        }

                        // Filter: if localOnly, exclude voices that require network
                        if (localOnly && networkRequired) continue;

                        JSObject o = new JSObject();
                        o.put("name", v.getName());
                        o.put("lang", langTag);
                        o.put("networkRequired", networkRequired);
                        o.put("index", index);
                        voicesArr.put(o);

                        index++;
                    }
                }
            } else {
                // Pre-Lollipop doesn't expose per-voice list; return empty
            }

            JSObject ret = new JSObject();
            ret.put("voices", voicesArr);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read installed voices", e);
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (tts != null) {
            try {
                tts.shutdown();
            } catch (Throwable ignored) {}
            tts = null;
        }
    }
}
