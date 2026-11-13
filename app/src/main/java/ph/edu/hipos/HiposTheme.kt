package ph.edu.hipos

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val Forest = Color(0xFF176245)
val DarkForest = Color(0xFF103F30)
val PaleMint = Color(0xFFEAF4ED)

@Composable
fun HiposTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(primary = Forest, onPrimary = Color.White, secondary = DarkForest,
            background = Color(0xFFF8FBF8), surface = Color.White, surfaceVariant = PaleMint),
        typography = Typography(), content = content
    )
}

@Composable
fun InfoCard(title: String, detail: String, note: String = "", modifier: Modifier = Modifier) {
    ElevatedCard(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = DarkForest)
            Text(detail, style = MaterialTheme.typography.bodyMedium)
            if (note.isNotBlank()) Text(note, color = Color(0xFF5F6F64), style = MaterialTheme.typography.bodySmall)
        }
    }
}
