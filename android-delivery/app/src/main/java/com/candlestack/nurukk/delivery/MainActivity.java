package com.candlestack.nurukk.delivery;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    ensurePushChannels();
    super.onCreate(savedInstanceState);
  }

  private void ensurePushChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationManager nm = getSystemService(NotificationManager.class);
    if (nm == null) {
      return;
    }

    NotificationChannel general = new NotificationChannel(
      "default",
      "General",
      NotificationManager.IMPORTANCE_HIGH
    );
    general.setDescription("Order and account updates");
    general.enableVibration(true);
    general.setShowBadge(true);
    nm.createNotificationChannel(general);

    NotificationChannel urgent = new NotificationChannel(
      "high_priority",
      "Urgent",
      NotificationManager.IMPORTANCE_HIGH
    );
    urgent.setDescription("New orders and delivery alerts");
    urgent.enableVibration(true);
    urgent.setShowBadge(true);
    urgent.setLightColor(Color.GREEN);
    nm.createNotificationChannel(urgent);
  }
}
