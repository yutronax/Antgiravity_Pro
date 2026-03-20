## [2026-03-20 15:10]

**Request:** Terminal otomatik yürütme politikasının kontrol paneli üzerinden manuel olarak değiştirilebilmesi için ayar eklenmesi.

**Files:**
- manager_pro.py
- acc-pro/src/App.tsx
- memory/logs/activity_log_2026-03-20.md

**Change:** 
- Python API'sine `get_terminal_policy` ve `set_terminal_policy` metodları eklendi.
- React arayüzüne (Dashboard) "Agent Autonomy" kontrol kartı ve mod seçim butonları (Off, Auto, Turbo) eklendi.
- `manager_pro.py` üzerindeki import hataları giderildi.

**Reason:** Kullanıcının terminal politikasını IDE ayarları yerine kontrol paneli üzerinden yönetme isteği.

**Test Result:** manuel kontrol — Arayüz bileşenleri eklendi, API metodları hazır.
