## [2026-03-21 16:16]

**Request:** Makale ve araştırma niyetlerinin sisteme eklenmesi (Canlı Demo).

**Changes:**
- `rule_map.json` içerisine `research` id'li yeni bir intent eklendi.
- "araştırma", "makale", "incele" gibi kelimeler tetikleyici olarak tanımlandı.
- `DEPENDENCY_GRAPH` güncellendi (`research` -> `logging`).

**Result:** Sistem artık araştırma görevlerinde otomatik olarak günlük tutma ve planlama kurallarını birleştirerek yükleyecek.
