package ph.edu.hipos

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import java.text.DateFormat
import java.util.Date

@Composable
fun StaffApp(isUnlocked: MutableState<Boolean>) {
    val ctx = LocalContext.current
    val gate = remember { StaffPinStore(ctx.applicationContext) }
    val db = remember { HiposDatabase(ctx.applicationContext) }
    var hasPin by remember { mutableStateOf(gate.hasPin()) }
    if (!hasPin) {
        StaffPinScreen(creating = true, onSubmit = { pin ->
            gate.create(pin); hasPin = true; isUnlocked.value = true; true
        })
        return
    }
    if (!isUnlocked.value) {
        StaffPinScreen(creating = false, onSubmit = { pin ->
            val accepted = gate.verify(pin)
            if (accepted) isUnlocked.value = true
            accepted
        })
        return
    }
    var page by remember { mutableStateOf("Dashboard") }
    var imported by remember { mutableStateOf(db.listReports()) }
    var rawReport by remember { mutableStateOf<ConcernReport?>(null) }
    var scanProblem by remember { mutableStateOf("") }
    var scannerKey by remember { mutableIntStateOf(0) }
    var info by remember { mutableStateOf("") }
    fun refresh() { imported = db.listReports() }

    Scaffold(topBar = { Surface(color = DarkForest) {
        Column(Modifier.fillMaxWidth().padding(18.dp)) {
            Text("HIPOS Staff", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Local dashboard · No internet", color = Color(0xFFCEE7D9))
        }
    } }, bottomBar = {
        NavigationBar {
            listOf(Triple("Dashboard", Icons.Default.Dashboard, "Dashboard"), Triple("Scan", Icons.Default.QrCodeScanner, "Scan"),
                Triple("Reports", Icons.Default.List, "Reports")).forEach { (id, icon, label) ->
                NavigationBarItem(selected = page == id, onClick = { page = id; info = "" },
                    icon = { Icon(icon, null) }, label = { Text(label) })
            }
        }
    }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (info.isNotBlank()) Text(info, color = Forest)
            when (page) {
                "Dashboard" -> {
                    TitleStaff("Overview")
                    InfoCard("${imported.size} concerns imported", "Only QR reports directly scanned and confirmed by this staff device are included.")
                    val pending = imported.count { it.status != "Reviewed" }
                    InfoCard("$pending not yet reviewed", "Use the Reports tab to change review status.")
                    HiposContent.concernCategories.forEach { name ->
                        val count = imported.count { it.category == name }
                        Text("$name: $count", style = MaterialTheme.typography.bodyMedium)
                        LinearProgressIndicator(progress = { if (imported.isEmpty()) 0f else count.toFloat() / imported.size },
                            modifier = Modifier.fillMaxWidth())
                    }
                    InfoCard("Local-only limitation", "No cloud or cross-device synchronization. Staff data stays in this application on this device. Export and encryption are not included in this prototype.")
                }
                "Scan" -> {
                    TitleStaff("Import a report")
                    if (rawReport == null && scanProblem.isBlank()) {
                        key(scannerKey) {
                            OfflineScanner(onCodeFound = { raw ->
                                try { rawReport = QrProtocol.decode(raw) }
                                catch (e: Exception) { scanProblem = e.message ?: "Invalid QR report" }
                            })
                        }
                    }
                    if (scanProblem.isNotBlank()) {
                        InfoCard("Invalid report QR", scanProblem)
                        Button(onClick = { scanProblem = ""; scannerKey++ }) { Text("Try scanning again") }
                    }
                    rawReport?.let { r ->
                        InfoCard("Review before importing", "Category: ${r.category}\nArea: ${r.area}\nConcern: ${r.description}\nCreated: ${DateFormat.getDateTimeInstance().format(Date(r.createdAt))}",
                            "QR report text is not encrypted. Never import unsolicited sensitive personal information.")
                        Button(onClick = {
                            val new = db.importReport(r)
                            refresh()
                            info = if (new) "Report imported to this staff device." else "Duplicate QR: report already stored."
                            rawReport = null; scannerKey++; page = "Reports"
                        }, modifier = Modifier.fillMaxWidth()) { Text("Confirm import") }
                        OutlinedButton(onClick = { rawReport = null; scannerKey++ }) { Text("Cancel and scan again") }
                    }
                }
                "Reports" -> {
                    TitleStaff("Imported concerns")
                    if (imported.isEmpty()) Text("No QR reports imported yet.")
                    imported.forEach { r ->
                        ElevatedCard(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(r.category, fontWeight = FontWeight.Bold)
                                Text(r.description)
                                Text("${r.area} · ${DateFormat.getDateTimeInstance().format(Date(r.createdAt))}", style = MaterialTheme.typography.bodySmall)
                                Text("Status: ${r.status}", color = DarkForest, fontWeight = FontWeight.Medium)
                                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf("New", "Under Review", "Reviewed").forEach { st ->
                                        FilterChip(selected = r.status == st, onClick = { db.updateStatus(r.id, st); refresh() }, label = { Text(st) })
                                    }
                                }
                                TextButton(onClick = { db.delete(r.id); refresh() }) { Text("Delete local report") }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TitleStaff(s: String) { Text(s, style = MaterialTheme.typography.headlineSmall, color = DarkForest, fontWeight = FontWeight.Bold) }

@Composable
private fun StaffPinScreen(creating: Boolean, onSubmit: (String) -> Boolean) {
    var pin by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("HIPOS Staff", style = MaterialTheme.typography.headlineMedium, color = DarkForest, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        Text(if (creating) "Set a local PIN on a designated staff device. This is not online identity verification." else "Enter the PIN to access locally imported concerns.")
        Spacer(Modifier.height(20.dp))
        OutlinedTextField(value = pin, onValueChange = { if (it.length <= 12 && it.all(Char::isDigit)) pin = it },
            label = { Text(if (creating) "New PIN (6–12 digits)" else "Staff PIN") },
            visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            modifier = Modifier.fillMaxWidth(), singleLine = true)
        if (creating) {
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = confirm, onValueChange = { if (it.length <= 12 && it.all(Char::isDigit)) confirm = it },
                label = { Text("Confirm PIN") }, visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), modifier = Modifier.fillMaxWidth(), singleLine = true)
        }
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(16.dp))
        Button(onClick = {
            error = when {
                pin.length < 6 -> "PIN must contain at least six digits"
                creating && pin != confirm -> "PIN confirmation does not match"
                !onSubmit(pin) -> "Incorrect PIN"
                else -> ""
            }
        }, modifier = Modifier.fillMaxWidth()) { Text(if (creating) "Create local staff PIN" else "Unlock") }
        Spacer(Modifier.height(12.dp))
        Text("Prototype security: keep this staff APK on school-authorized devices. A self-set PIN is not proof of employment; no remote authentication is provided.",
            style = MaterialTheme.typography.bodySmall, color = Color.Gray)
    }
}
