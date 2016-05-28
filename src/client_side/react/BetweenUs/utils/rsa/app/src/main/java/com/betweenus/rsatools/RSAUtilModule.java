package com.betweenus.rsatools;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.security.KeyPairGenerator;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.EncodedKeySpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.security.spec.InvalidKeySpecException;
import java.security.NoSuchAlgorithmException;

// import java.util.Map;
// import java.util.HashMap; 
import android.util.Base64;
import javax.crypto.Cipher;

class RSAUtilModule extends ReactContextBaseJavaModule {
    
  private static Cipher cipher;

  public RSAUtilModule(ReactApplicationContext reactContext){
    super(reactContext);
    try {
        cipher = Cipher.getInstance("RSA");
    }
    catch ( Exception exce ) {
            cipher = null;
        }
    
  }

  @Override
  public String getName() {
    return "ReactNativeRSATOOLS";
  }
  @ReactMethod
    public void GenerateKeys(int numBits, Promise promise) {
        try {
            WritableMap resultData = new WritableNativeMap();
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(numBits);
            KeyPair keyPair = keyGen.genKeyPair();
            PrivateKey privateKey = keyPair.getPrivate();
            PublicKey publicKey = keyPair.getPublic();
            
            // Get the bytes of the public and private keys
            byte[] privateKeyBytes = privateKey.getEncoded();
            byte[] publicKeyBytes = publicKey.getEncoded();
            resultData.putString("private", Base64.encodeToString(privateKeyBytes, Base64.DEFAULT));
            resultData.putString("public", Base64.encodeToString(publicKeyBytes, Base64.DEFAULT));
            promise.resolve(resultData);

        } catch ( Exception exce ) {
            promise.reject("err", exce.getMessage());
        }
    }
    @ReactMethod
    public void EncryptWithPublicKey(String text_to_encrypt, String public_key, Promise promise) {
        try {
            String stringCipherText = "";
            byte[] newPublicKeyBytes = Base64.decode(public_key, Base64.DEFAULT);
            X509EncodedKeySpec pbkKeySpec = new X509EncodedKeySpec(newPublicKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey newPublicKey = keyFactory.generatePublic(pbkKeySpec);
            byte[] cipherText = null;
            // get an RSA cipher object and print the provider
            
            // encrypt the plain text using the public key
            cipher.init(Cipher.ENCRYPT_MODE, newPublicKey);
            if (text_to_encrypt.getBytes().length > 245)
            {
                throw new Exception("String length (" + text_to_encrypt.getBytes().length + ") must be less than 246");
            }
            cipherText = cipher.doFinal(text_to_encrypt.getBytes());
            stringCipherText = Base64.encodeToString(cipherText, Base64.DEFAULT);
            promise.resolve(stringCipherText);

        } catch ( Exception exce ) {
            promise.reject("err", exce.getMessage());
        }
    }
    @ReactMethod
    public void DecryptWithPrivateKey(String cipher_text_to_decrypt, String private_key, Promise promise) {
        try {
            String decryptedText = "";
            byte[] dectyptedText = null;
            byte[] newPrivateKeyBytes = Base64.decode(private_key, Base64.DEFAULT);
            PKCS8EncodedKeySpec prvKeySpec = new PKCS8EncodedKeySpec(newPrivateKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PrivateKey newPrivateKey = keyFactory.generatePrivate(prvKeySpec);
            byte[] text_to_decrypt = Base64.decode(cipher_text_to_decrypt, Base64.DEFAULT);
            
            
            cipher.init(Cipher.DECRYPT_MODE, newPrivateKey);
            dectyptedText = cipher.doFinal(text_to_decrypt);
            promise.resolve(new String(dectyptedText));

        } catch ( Exception exce ) {
            promise.reject("err", exce.getMessage());
        }
    }
}
