package ph.edu.hipos

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import org.json.JSONObject
import java.util.UUID

/** Short, deliberately non-identifying JSON payload; QR is NOT encrypted or anonymous in person. */
object QrProtocol {
    const val MARKER = "HIPOS1"
    const val MAX_BYTES = 650

    fun encode(report: ConcernReport): String {
        val data = JSONObject().apply {
            put("type", MARKER); put("id", report.id)
            put("category", report.category); put("area", report.area)
            put("description", report.description); put("createdAt", report.createdAt)
        }.toString()
        require(data.toByteArray(Charsets.UTF_8).size <= MAX_BYTES) { "Report too long for a QR code" }
        return data
    }

    fun decode(raw: String): ConcernReport {
        require(raw.toByteArray(Charsets.UTF_8).size <= MAX_BYTES) { "QR data is too large" }
        val j = JSONObject(raw)
        require(j.optString("type") == MARKER) { "Not a HIPOS report" }
        val id = j.getString("id")
        require(UUID.fromString(id).toString() == id) { "Invalid report identifier" }
        val category = j.getString("category")
        val area = j.getString("area")
        val description = j.getString("description")
        val createdAt = j.getLong("createdAt")
        require(category in HiposContent.concernCategories) { "Unknown concern category" }
        require(area in HiposContent.schoolAreas) { "Unknown school area" }
        require(description.length in 5..160 && description.toByteArray(Charsets.UTF_8).size <= 300 && description.none { it.isISOControl() && it != '\n' }) { "Invalid report description" }
        require(createdAt in 1577836800000L..(System.currentTimeMillis() + 86_400_000L)) { "Invalid report timestamp" }
        return ConcernReport(id, category, area, description, createdAt)
    }

    fun render(data: String, size: Int = 840): Bitmap {
        val matrix: BitMatrix = MultiFormatWriter().encode(
            data, BarcodeFormat.QR_CODE, size, size,
            mapOf(EncodeHintType.MARGIN to 2, EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M)
        )
        val pixels = IntArray(size * size)
        for (y in 0 until size) for (x in 0 until size) pixels[y * size + x] = if (matrix[x,y]) Color.BLACK else Color.WHITE
        return Bitmap.createBitmap(pixels, size, size, Bitmap.Config.ARGB_8888)
    }
}
