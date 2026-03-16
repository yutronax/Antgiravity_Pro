# Antigravity Control Center PRO

## Proje Amacı
Antigravity agent'ının davranışlarını, kurallarını ve sistem sağlığını yönetmek için tasarlanmış fütüristik, profesyonel bir kontrol paneli.

## Sistem Mimarisi
- **Frontend:** React + TypeScript + Framer Motion (Modern, Glassmorphism UI)
- **Backend:** Python + PyWebView (Dinamik dosya yönetimi ve yama sistemi)
- **Bridge:** PyWebView JS API (JS ve Python arası çift yönlü iletişim)

## Kullanılan Teknolojiler
- **Core:** Python 3.x, React 18+
- **UI:** CSS, Framer Motion, Lucide Icons
- **Packaging:** PyInstaller (Standalone EXE)

## Kritik Dosyalar
- `manager_pro.py`: Ana Python launcher ve API köprüsü.
- `acc-pro/src/App.tsx`: Ana React arayüzü ve state yönetimi.
- `GEMINI.md`: Agent'ın okuduğu dinamik kural dosyası.
- `main.js`: Yama (Patch) uygulanan Antigravity çekirdek dosyası.
