plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "ph.edu.hipos"
    compileSdk = 36

    defaultConfig {
        applicationId = "ph.edu.hipos"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    flavorDimensions += "role"
    productFlavors {
        create("student") {
            dimension = "role"
            applicationIdSuffix = ".student"
            resValue("string", "app_name", "HIPOS Student")
        }
        create("staff") {
            dimension = "role"
            applicationIdSuffix = ".staff"
            resValue("string", "app_name", "HIPOS Staff")
        }
    }

    buildFeatures { compose = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.11.01"))
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.10.0")
    implementation("com.google.zxing:core:3.5.3")
    add("staffImplementation", "com.google.mlkit:barcode-scanning:17.3.0")
    add("staffImplementation", "androidx.camera:camera-core:1.5.3")
    add("staffImplementation", "androidx.camera:camera-camera2:1.5.3")
    add("staffImplementation", "androidx.camera:camera-lifecycle:1.5.3")
    add("staffImplementation", "androidx.camera:camera-view:1.5.3")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
