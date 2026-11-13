package ph.edu.hipos

import androidx.compose.foundation.Image
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import java.text.DateFormat
import java.util.Date

@Composable
fun StudentApp() {
    val ctx = LocalContext.current
    val db = remember { HiposDatabase(ctx.applicationContext) }
    var page by rememberSaveable { mutableStateOf("Home") }
    var reports by remember { mutableStateOf(db.listReports()) }
    var shareId by remember { mutableStateOf<String?>(null) }
    var classification by remember { mutableStateOf(HiposContent.waste.first()) }

    fun reload() { reports = db.listReports() }
    Scaffold(
        topBar = {
            Surface(color = DarkForest) {
                Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp)) {
                    Text("HIPOS", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Prevent · Reuse · Carry Out | Offline", color = Color(0xFFCCEBD9), style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        bottomBar = {
            NavigationBar {
                listOf(Triple("Home", Icons.Default.Home, "Home"), Triple("Guide", Icons.Default.MenuBook, "Guide"),
                    Triple("Reports", Icons.Default.Description, "Reports"), Triple("About", Icons.Default.Info, "About")).forEach { (name, icon, label) ->
                    NavigationBarItem(selected = page == name || (page == "Share" && name == "Reports"),
                        onClick = { page = name }, icon = { Icon(icon, contentDescription = null) }, label = { Text(label) })
                }
            }
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (page) {
                "Home" -> {
                    InfoCard("Less waste starts before purchase", "HIPOS works completely offline. Explore practical ways to prevent disposable waste before carrying it out.", "No internet, account, or compulsory pouch.")
                    Button(onClick = { page = "Guide" }, Modifier.fillMaxWidth()) { Icon(Icons.Default.Eco, null); Spacer(Modifier.width(8.dp)); Text("Open Waste Prevention Guide") }
                    OutlinedButton(onClick = { page = "Reuse" }, Modifier.fillMaxWidth()) { Text("Reusable Alternatives") }
                    OutlinedButton(onClick = { page = "Classify" }, Modifier.fillMaxWidth()) { Text("Waste Classification & Safety") }
                    OutlinedButton(onClick = { page = "Carry" }, Modifier.fillMaxWidth()) { Text("Safe Carry-Out Guidance") }
                    OutlinedButton(onClick = { page = "NewReport" }, Modifier.fillMaxWidth()) { Text("Report a Concern Privately") }
                    InfoCard("School policy", "HIPOS supports the school's no-trash-can policy. A proposed canteen container-return scheme is not an existing service unless explicitly approved.")
                }
                "Guide" -> {
                    Title("Waste prevention guide")
                    Text("Choose a situation and consider lower-waste options before producing disposable packaging.")
                    HiposContent.prevention.forEach { InfoCard(it.title, it.advice, it.note) }
                    OutlinedButton(onClick = { page = "Reuse" }) { Text("See reusable alternatives") }
                }
                "Reuse" -> {
                    Title("Reusable alternatives")
                    InfoCard("Approval comes first", "Student-owned containers may be used only where school rules and vendors allow. Shared canteen containers and returns require school approval and a proper cleaning procedure.")
                    HiposContent.reuse.forEach { InfoCard(it.title, it.advice, it.note) }
                }
                "Classify" -> {
                    Title("Waste classification")
                    Text("Choose the material to view preloaded safe-handling guidance.")
                    HiposContent.waste.forEach { item ->
                        FilterChip(selected = classification.title == item.title, onClick = { classification = item }, label = { Text(item.title) })
                    }
                    InfoCard(classification.title, classification.instructions,
                        if (classification.safeForPouch) "Suitable for brief dry-waste storage if clean and dry." else "Not suitable for the HIPOS dry-waste pouch.")
                }
                "Carry" -> {
                    Title("Carry-out and safety")
                    InfoCard("Prevent", "Avoid unnecessary packaging and food waste where practical.")
                    InfoCard("Reuse", "Prefer a clean reusable bottle, lunchbox, or utensils if school rules permit.")
                    InfoCard("Carry out", "Only suitable dry, nonhazardous waste may be kept briefly in an optional pouch or suitable personal container, then disposed through a lawful, authorized off-campus arrangement.")
                    InfoCard("Unsuitable waste", "Never carry sharp, hazardous, contaminated or unsanitary material in a personal dry-waste pouch. Ask authorized staff for the school's approved procedure.")
                    InfoCard("No verified destination", "HIPOS does not name nearby public bins or neighboring properties as disposal destinations. Confirm a lawful option with school personnel.")
                }
                "Reports" -> {
                    Title("My concerns")
                    InfoCard("Stored only on this phone", "Saving does not submit a report to staff. To share one, deliberately show its QR code to an authorized staff member. They can see who presents it.")
                    Button(onClick = { page = "NewReport" }, Modifier.fillMaxWidth()) { Text("Create a new concern") }
                    if (reports.isEmpty()) Text("No saved concerns yet.")
                    reports.forEach { r ->
                        ElevatedCard(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(r.category, fontWeight = FontWeight.Bold)
                                Text(r.description, style = MaterialTheme.typography.bodyMedium)
                                Text("${r.area} · ${DateFormat.getDateTimeInstance().format(Date(r.createdAt))}", style = MaterialTheme.typography.bodySmall)
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Button(onClick = { shareId = r.id; page = "Share" }) { Text("Show QR") }
                                    OutlinedButton(onClick = { db.delete(r.id); reload() }) { Text("Delete") }
                                }
                            }
                        }
                    }
                }
                "NewReport" -> ReportForm(onSave = { category, area, detail ->
                    db.create(category, area, detail)
                    reload(); page = "Reports"
                }, onCancel = { page = "Reports" })
                "Share" -> {
                    val report = reports.firstOrNull { it.id == shareId }
                    if (report == null) { Text("Report unavailable."); Button(onClick = { page = "Reports" }) { Text("Back") } }
                    else {
                        Title("Share report via QR")
                        Text("Show only to authorized staff. This QR contains your concern text and is readable by other QR scanners. No report is sent automatically.")
                        val encoded = remember(report.id) { QrProtocol.encode(report) }
                        val bitmap = remember(encoded) { QrProtocol.render(encoded) }
                        Image(bitmap.asImageBitmap(), contentDescription = "Report transfer QR code", modifier = Modifier.fillMaxWidth().height(300.dp))
                        Text("QR ready — not yet confirmed received", color = DarkForest, fontWeight = FontWeight.Bold)
                        OutlinedButton(onClick = { page = "Reports" }) { Text("Back to my reports") }
                    }
                }
                "About" -> {
                    Title("About HIPOS")
                    InfoCard("Hygienic and Intelligent Personal Organization System", "A proposed offline waste-prevention and personal waste management application for a no-trash-can campus.")
                    InfoCard("Privacy", "No accounts, GPS tracking, internet permission, or automatic reporting. Concerns are stored locally until you delete them. QR sharing is voluntary and is not anonymous in person.")
                    InfoCard("Accessibility", "Students without smartphones should be provided equivalent printed guidance and a school-approved feedback option.")
                    InfoCard("Important", "HIPOS is a project prototype. School personnel must verify safe handling procedures, canteen permissions, and lawful disposal arrangements before any real campus rollout.")
                }
            }
        }
    }
}

@Composable private fun Title(text: String) { Text(text, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = DarkForest) }

@Composable
private fun Choices(label: String, values: List<String>, selected: String, onSelect: (String) -> Unit) {
    Text(label, style = MaterialTheme.typography.labelLarge)
    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        values.forEach { v -> FilterChip(selected = selected == v, onClick = { onSelect(v) }, label = { Text(v) }) }
    }
}

@Composable
private fun ReportForm(onSave: (String, String, String) -> Unit, onCancel: () -> Unit) {
    var category by rememberSaveable { mutableStateOf(HiposContent.concernCategories.first()) }
    var area by rememberSaveable { mutableStateOf(HiposContent.schoolAreas.first()) }
    var description by rememberSaveable { mutableStateOf("") }
    Title("Create a concern")
    InfoCard("Please avoid personal details", "Do not include names, student numbers, contact information, or identifying descriptions. Only share the QR if you choose to.")
    Choices("Concern category", HiposContent.concernCategories, category) { category = it }
    Choices("Area (optional)", HiposContent.schoolAreas, area) { area = it }
    OutlinedTextField(value = description, onValueChange = { if (it.length <= 160 && it.all { ch -> !ch.isISOControl() || ch == '\n' }) description = it },
        modifier = Modifier.fillMaxWidth(), label = { Text("Short description") }, minLines = 3, maxLines = 5,
        supportingText = { Text("${description.length}/160 characters; at least 5 needed; maximum 300 UTF-8 bytes") })
    Button(onClick = { onSave(category, area, description.trim()) }, enabled = description.trim().length >= 5 && description.trim().toByteArray(Charsets.UTF_8).size <= 300,
        modifier = Modifier.fillMaxWidth()) { Text("Save on this phone") }
    TextButton(onClick = onCancel) { Text("Cancel") }
}
