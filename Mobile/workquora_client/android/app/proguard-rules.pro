# google_sign_in_android pulls in smart_auth, which optionally supports the
# legacy Google "Smart Lock for Passwords" credential-hint API
# (com.google.android.gms.auth.api.credentials.*). That API isn't present in
# the play-services-auth version this app resolves, and smart_auth already
# handles that absence gracefully at runtime — but R8 doesn't know that and
# fails the release build over it unless told to ignore the missing classes.
# Rules below are exactly what Android Gradle Plugin generated into
# build/app/outputs/mapping/release/missing_rules.txt after the first
# `flutter build apk --release` failure.
-dontwarn com.google.android.gms.auth.api.credentials.Credential$Builder
-dontwarn com.google.android.gms.auth.api.credentials.Credential
-dontwarn com.google.android.gms.auth.api.credentials.CredentialPickerConfig$Builder
-dontwarn com.google.android.gms.auth.api.credentials.CredentialPickerConfig
-dontwarn com.google.android.gms.auth.api.credentials.CredentialRequest$Builder
-dontwarn com.google.android.gms.auth.api.credentials.CredentialRequest
-dontwarn com.google.android.gms.auth.api.credentials.CredentialRequestResponse
-dontwarn com.google.android.gms.auth.api.credentials.Credentials
-dontwarn com.google.android.gms.auth.api.credentials.CredentialsClient
-dontwarn com.google.android.gms.auth.api.credentials.HintRequest$Builder
-dontwarn com.google.android.gms.auth.api.credentials.HintRequest
