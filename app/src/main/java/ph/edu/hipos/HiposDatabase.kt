package ph.edu.hipos

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.util.UUID

data class ConcernReport(
    val id: String,
    val category: String,
    val area: String,
    val description: String,
    val createdAt: Long,
    val status: String = "New"
)

/** SQLiteOpenHelper keeps this starter fully offline and avoids a schema-codegen requirement. */
class HiposDatabase(context: Context) : SQLiteOpenHelper(context, "hipos_local.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""CREATE TABLE reports (
            id TEXT PRIMARY KEY NOT NULL, category TEXT NOT NULL, area TEXT NOT NULL,
            description TEXT NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL
        )""")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Future versions must use non-destructive incremental migrations.
    }

    fun create(category: String, area: String, description: String): ConcernReport {
        require(category in HiposContent.concernCategories)
        require(area in HiposContent.schoolAreas)
        require(description.trim().length in 5..160 && description.trim().toByteArray(Charsets.UTF_8).size <= 300)
        val r = ConcernReport(UUID.randomUUID().toString(), category, area, description.trim(), System.currentTimeMillis())
        require(write(r))
        return r
    }

    fun importReport(r: ConcernReport): Boolean {
        require(r.category in HiposContent.concernCategories)
        require(r.area in HiposContent.schoolAreas)
        require(r.description.length in 5..160 && r.description.toByteArray(Charsets.UTF_8).size <= 300)
        return write(r.copy(status = "New"))
    }

    private fun write(r: ConcernReport): Boolean {
        val cv = ContentValues().apply {
            put("id", r.id); put("category", r.category); put("area", r.area)
            put("description", r.description); put("created_at", r.createdAt); put("status", r.status)
        }
        return writableDatabase.insertWithOnConflict("reports", null, cv, SQLiteDatabase.CONFLICT_IGNORE) != -1L
    }

    fun listReports(): List<ConcernReport> {
        val results = mutableListOf<ConcernReport>()
        readableDatabase.rawQuery("SELECT id, category, area, description, created_at, status FROM reports ORDER BY created_at DESC", null).use { cur ->
            while (cur.moveToNext()) results += ConcernReport(
                id = cur.getString(0), category = cur.getString(1), area = cur.getString(2),
                description = cur.getString(3), createdAt = cur.getLong(4), status = cur.getString(5)
            )
        }
        return results
    }

    fun updateStatus(id: String, status: String) {
        require(status in setOf("New", "Under Review", "Reviewed"))
        val cv = ContentValues().apply { put("status", status) }
        writableDatabase.update("reports", cv, "id = ?", arrayOf(id))
    }
    fun delete(id: String) { writableDatabase.delete("reports", "id = ?", arrayOf(id)) }
}
