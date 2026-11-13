package ph.edu.hipos

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.barcode.common.BarcodeScanning
import com.google.mlkit.vision.barcode.common.BarcodeScannerOptions
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.atomic.AtomicBoolean

/** Scanner uses ML Kit's model bundled in the Staff APK; no network downloads. */
@OptIn(ExperimentalGetImage::class)
@Composable
fun OfflineScanner(onCodeFound: (String) -> Unit) {
    val context = LocalContext.current
    val owner = context as LifecycleOwner
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    val requestPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }
    val consumed = remember { AtomicBoolean(false) }
    val options = remember { BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build() }
    val scanner = remember { BarcodeScanning.getClient(options) }
    var provider by remember { mutableStateOf<ProcessCameraProvider?>(null) }

    DisposableEffect(Unit) {
        onDispose {
            provider?.unbindAll()
            scanner.close()
        }
    }
    if (!granted) {
        InfoCard("Camera permission", "The staff app uses the camera only to scan a QR report. It does not upload images or require internet.")
        Button(onClick = { requestPermission.launch(Manifest.permission.CAMERA) }) { Text("Allow camera for scanning") }
    } else {
        Text("Point the camera at a HIPOS student report QR. Review the decoded information before importing.")
        AndroidView(factory = { ctx ->
            val view = PreviewView(ctx)
            val future = ProcessCameraProvider.getInstance(ctx)
            future.addListener({
                try {
                    val camProvider = future.get()
                    provider = camProvider
                    val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
                    val analysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                    analysis.setAnalyzer(ContextCompat.getMainExecutor(ctx)) { frame ->
                        val media = frame.image
                        if (media == null || consumed.get()) { frame.close(); return@setAnalyzer }
                        val input = InputImage.fromMediaImage(media, frame.imageInfo.rotationDegrees)
                        scanner.process(input)
                            .addOnSuccessListener { barcodes ->
                                val found = barcodes.firstOrNull { it.format == Barcode.FORMAT_QR_CODE && !it.rawValue.isNullOrBlank() }?.rawValue
                                if (found != null && consumed.compareAndSet(false, true)) onCodeFound(found)
                            }
                            .addOnFailureListener { /* Bad frames are normal; continue scanning. */ }
                            .addOnCompleteListener { frame.close() }
                    }
                    camProvider.unbindAll()
                    camProvider.bindToLifecycle(owner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
                } catch (_: Exception) {
                    // Inaccessible cameras are handled by exiting this screen and retrying on a physical device.
                }
            }, ContextCompat.getMainExecutor(ctx))
            view
        }, modifier = Modifier.fillMaxWidth().height(310.dp))
    }
}
