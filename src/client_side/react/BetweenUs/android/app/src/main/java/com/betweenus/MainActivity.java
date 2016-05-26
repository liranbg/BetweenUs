package com.betweenus;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.github.xinthink.rnmk.ReactMaterialKitPackage;
import com.betweenus.rsatools.RSAUtilPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.bitgo.randombytes.RandomBytesPackage;

import com.walkme.sdk.api.WalkMe;
import android.app.Activity;
import android.os.Bundle;

import java.util.Arrays;
import java.util.List;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "BetweenUs";
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WalkMe.startWalkMe(getApplication(), "52500fb388334eeeac578e71f9d9fbea");
    }

    /**
     * Returns whether dev mode should be enabled.
     * This enables e.g. the dev menu.
     */
    @Override
    protected boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    /**
     * A list of packages used by the app. If the app uses additional views
     * or modules besides the default ones, add more packages here.
     */
    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new VectorIconsPackage(),
            new RandomBytesPackage(),
            new RSAUtilPackage(),
            new ReactMaterialKitPackage()
        );
    }
}
