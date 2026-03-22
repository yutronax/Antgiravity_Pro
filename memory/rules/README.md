# Antigravity Modular Rule Router

Bu sistem, devasa kural dosyalarını parça parça ve ihtiyaca göre yüklemek için tasarlanmıştır.

## Mimari
1. **GEMINI.md**: Giriş noktası. `ROUTER_ENABLED: true` bayrağı ile router'ı tetikler.
2. **Rule Segments**: `memory/rules/` altındaki `.md` dosyaları (workflow, logging, vb.).
3. **Rule Map**: `rule_map.json`. Hangi kelimelerin hangi kuralları tetikleyeceğini ve bağımlılıklarını belirler.
4. **Router Logic**: `manager_pro.py` içerisindeki Python sınıfları.

## Yeni Kural Ekleme
1. `memory/rules/` altında yeni bir `.md` dosyası oluşturun.
2. `rule_map.json` içerisindeki `rules` listesine niyet (intent), tetikleyici kelimeler ve öncelik (priority) ekleyin.

## Loglama
Sistemin kararları `memory/logs/router_log_YYYY-MM-DD.md` dosyasından takip edilebilir.

## Avantajlar
- **Performans**: Sadece gerekli kurallar yüklendiği için token kullanımı azalır.
- **Risk Yönetimi**: Bir segmentteki hata tüm sistemi bozmaz.
- **Yönetilebilirlik**: Kurallar mantıksal parçalara ayrılmıştır.
