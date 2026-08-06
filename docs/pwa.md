# PWA kullanımı ve bakımı

Site, desteklenen Android ve masaüstü Chromium tarayıcılarında tarayıcının kurulum seçeneğiyle yüklenebilir. Kurulum uygun olduğunda footer alanında **Uygulamayı Yükle** düğmesi görünür. iPhone ve iPad’de bu düğme, **Paylaş → Ana Ekrana Ekle → Ekle** adımlarını gösterir.

Kurulan site standalone pencerede açılır. Yeni deployment algılandığında otomatik yenileme yapılmaz; kullanıcı **Şimdi Güncelle** veya **Daha Sonra** seçeneklerinden birini seçer.

Offline destek tüm blog arşivini indirmez. Daha önce ziyaret edilmiş sınırlı sayıdaki sayfa cache’den açılabilir; diğer navigasyonlar küçük bir bağlantı yok sayfasına düşer. Online durumda HTML her zaman önce ağdan istenir.

Geliştirme sırasında production build ve preview kullanın:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Service Worker’ı temizlemek için tarayıcının Application/Storage panelinden kaydı kaldırıp site verilerini temizleyin. Cache temizliği de aynı paneldeki Cache Storage bölümünden yapılabilir.

Bu PWA katmanında push notification, backend, üyelik, cookie veya kurulum takibi yoktur. Authorization içeren, cross-origin ve non-GET istekler cache’lenmez.
