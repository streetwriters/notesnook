package com.streetwriters.notesnook;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

public class IntentActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = this.getIntent();
        intent.setClass(getBaseContext(), MainActivity.class);
        finishAffinity();
        startActivity(intent);

    }
}
