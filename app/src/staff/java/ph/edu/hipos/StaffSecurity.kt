package ph.edu.hipos

import android.content.Context
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/** Prototype staff-device PIN gate, not centralized proof of staff identity. */
class StaffPinStore(context: Context) {
    private val prefs = context.getSharedPreferences("staff_local_gate", Context.MODE_PRIVATE)
    fun hasPin(): Boolean = prefs.contains("verifier") && prefs.contains("salt")

    fun create(pin: String) {
        require(pin.matches(Regex("[0-9]{6,12}"))) { "Use a 6–12 digit PIN" }
        require(!hasPin()) { "PIN already set" }
        val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
        prefs.edit().putString("salt", Base64.encodeToString(salt, Base64.NO_WRAP))
            .putString("verifier", Base64.encodeToString(derive(pin, salt), Base64.NO_WRAP)).apply()
    }
    fun verify(pin: String): Boolean {
        if (!hasPin() || !pin.matches(Regex("[0-9]{6,12}"))) return false
        val salt = Base64.decode(prefs.getString("salt", ""), Base64.NO_WRAP)
        val expected = Base64.decode(prefs.getString("verifier", ""), Base64.NO_WRAP)
        return MessageDigest.isEqual(expected, derive(pin, salt))
    }
    private fun derive(pin: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(pin.toCharArray(), salt, 160_000, 256)
        return try { SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded }
        finally { spec.clearPassword() }
    }
}
