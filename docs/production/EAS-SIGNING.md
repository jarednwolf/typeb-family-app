## EAS Signing and Credentials

### iOS
1. Create App Store Connect API Key (Key ID, Issuer ID, .p8 private key)
2. Set EAS secrets:
```bash
eas secret:create --scope project --name APP_STORE_CONNECT_KEY_ID --value <KEY_ID>
eas secret:create --scope project --name APP_STORE_CONNECT_ISSUER_ID --value <ISSUER_ID>
export APP_STORE_CONNECT_PRIVATE_KEY_BASE64=$(base64 -i /abs/path/key.p8 | tr -d '\n')
eas secret:create --scope project --name APP_STORE_CONNECT_PRIVATE_KEY_BASE64 --value "$APP_STORE_CONNECT_PRIVATE_KEY_BASE64"
```
3. Generate credentials:
```bash
eas credentials -p ios
```

### Android
1. Service account JSON with Play Console access
2. Set EAS secret:
```bash
export GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=$(base64 -i /abs/path/sa.json | tr -d '\n')
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 --value "$GOOGLE_SERVICE_ACCOUNT_JSON_BASE64"
```
3. Generate credentials:
```bash
eas credentials -p android
```

### Build
```bash
eas build -p ios --profile production
eas build -p android --profile production
```


