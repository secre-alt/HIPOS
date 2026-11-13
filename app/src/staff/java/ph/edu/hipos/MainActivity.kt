package ph.edu.hipos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.mutableStateOf

class MainActivity : ComponentActivity() {
    private val isUnlocked = mutableStateOf(false)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(16, 63, 48)
        setContent { HiposTheme { StaffApp(isUnlocked = isUnlocked) } }
    }
    override fun onStop() {
        isUnlocked.value = false
        super.onStop()
    }
}
