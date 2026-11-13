package ph.edu.hipos

/** All guide content is packaged into the APK: no network requests. */
data class GuideItem(val title: String, val advice: String, val note: String = "")
data class WasteType(val title: String, val category: String, val instructions: String, val safeForPouch: Boolean)

object HiposContent {
    val prevention = listOf(
        GuideItem("Buying snacks", "Choose less-packaged food when available. Bring your own clean reusable food container where permitted.", "Do not assume the school canteen accepts outside containers without confirmation."),
        GuideItem("Buying drinks", "Bring a refillable bottle. Choose an approved refill option instead of a disposable cup when available."),
        GuideItem("Bringing lunch", "Pack food in a washable lunchbox and bring reusable utensils if permitted by school rules."),
        GuideItem("Before buying", "Ask whether packaging can be avoided. Buy only what you need to reduce leftovers and wrappers."),
        GuideItem("After eating", "Keep reusable items for washing. For unavoidable waste, check the handling guide before storing anything.")
    )
    val reuse = listOf(
        GuideItem("Student-owned water bottle", "Bring a clean refillable bottle. Use only permitted water sources.", "Student-owned option; verify school rules."),
        GuideItem("Personal lunchbox", "Bring a washable container and keep it separate from trash.", "Ask vendors before requesting food in your container."),
        GuideItem("Reusable utensils", "Bring reusable spoon and fork where appropriate, clean after use."),
        GuideItem("Canteen container-return program", "PROPOSED ONLY: any shared containers would need school approval, a hygienic washing process, return procedures, and a responsible operator.", "Not an existing campus service unless formally confirmed.")
    )
    val waste = listOf(
        WasteType("Clean paper", "Dry, nonhazardous", "Keep dry. Reuse if practical or carry to a permitted off-campus recycling/disposal arrangement.", true),
        WasteType("Dry plastic wrapper", "Dry, nonhazardous", "Store briefly in an optional clean pouch or suitable personal container, then carry out to authorized disposal.", true),
        WasteType("Empty clean bottle", "Reusable / recyclable", "Reuse if practical; otherwise carry out to a permitted off-campus arrangement.", true),
        WasteType("Food scraps", "Unsuitable for pouch", "Do not store food scraps in the dry-waste pouch. Ask authorized school staff for the approved handling procedure.", false),
        WasteType("Used tissues and hygiene waste", "Unsuitable for pouch", "Do not store in a dry-waste pouch. Follow the school's approved sanitary disposal procedure; ask staff if unclear.", false),
        WasteType("Sharp, chemical or contaminated waste", "Unsafe", "Do not touch, collect or store in your pouch. Inform authorized school staff and follow their safety instructions.", false)
    )
    val concernCategories = listOf("Unclear disposal guidance", "Excessive packaging", "Unsafe waste concern", "Reusable-container concern", "Other")
    val schoolAreas = listOf("Prefer not to say", "Canteen", "Classroom", "Hallway", "Other area")
}
