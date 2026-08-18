const siteUrl = 'https://www.basriakkaya.com';
const isPreview = import.meta.env.VERCEL_ENV === 'preview';

export const siteConfig = {
  name: 'Basri Akkaya',
  shortName: 'Basri',
  role: 'Bilgisayar Mühendisliği Öğrencisi ve Güvenlik Araştırmacısı',
  headline: 'Etik Hacker | Just a Tech | Linux Tutkunu',
  motto: 'Siber güvenlik bir hobi değil, sorumluluktur.',
  email: 'real0kage@protonmail.com',
  linkedin: 'https://www.linkedin.com/in/basriakkaya/',
  youtube: 'https://www.youtube.com/@basrikkya',
  github: 'https://github.com/basriakkaya',
  tryHackMe: 'https://tryhackme.com/p/basriakkaya',
  locale: 'tr-TR',
  language: 'tr',
  siteUrl,
  indexable: !isPreview && siteUrl === 'https://www.basriakkaya.com',
  defaultImage: '/images/security-researcher.png',
  defaultTitle: 'Basri Akkaya | Siber Güvenlik Araştırmacısı',
  description: 'Web güvenliği, ağ güvenliği, Linux, etik hacking, CVE araştırmaları ve sorumlu zafiyet bildirimi üzerine teknik yazılar, projeler ve notlar.',
  heroCopy: 'Günümün büyük bölümünü bilgisayar başında; web güvenliği, uygulama güvenliği ve güvenlik araştırmalarıyla geçiriyorum. İstenmeyen posta ve dolandırıcılık ağlarını bulup raporlamak, internetin biraz daha temiz kalmasına katkı sağlamak işin en sevdiğim tarafı.',
  about: 'Bilgisayar mühendisliği öğrencisiyim; web güvenliği, uygulama güvenliği, sızma testleri ve sorumlu açıklama odağında çalışıyorum. Binlerce kötü niyetli siteyi raporladım. Güvenliği yalnızca teknik bir uğraş değil, sonuçları olan bir sorumluluk olarak görüyorum.',
  focus: ['Web Güvenliği', 'Uygulama Güvenliği', 'Sızma Testleri', 'Sorumlu Açıklama', 'Güvenlik Araştırmaları', 'Linux'],
  cves: [
    { id: 'CVE-2026-52662', url: 'https://www.cve.org/CVERecord?id=CVE-2026-52662' },
    { id: 'CVE-2026-16323', url: 'https://www.cve.org/CVERecord?id=CVE-2026-16323' },
  ],
  achievements: [
    { title: 'NASA VDP — 2026 Hall of Fame', titleEn: 'NASA VDP — 2026 Hall of Fame', description: 'NASA Vulnerability Disclosure Program kapsamında kabul edilen iki P1 (kritik öncelik) güvenlik bildirimi: path traversal ve SQL injection. Bugcrowd Hall of Fame kaydı yayımlandı; Letter of Recognition (LOR) bekleniyor.', descriptionEn: 'Two P1 (critical-priority) security submissions accepted under the NASA Vulnerability Disclosure Program: path traversal and SQL injection. The Bugcrowd Hall of Fame entry is public; the Letter of Recognition (LOR) is pending.', url: 'https://bugcrowd.com/h/realkage', status: 'HOF · LOR bekleniyor', statusEn: 'HOF · LOR pending', findings: ['Path Traversal', 'SQL Injection'], evidence: '/images/recognition/nasa-bugcrowd-evidence.png', evidenceAlt: 'Bugcrowd üzerinde NASA hedefi için 13 Ağustos 2026 tarihinde kabul edilmiş iki P1 bildirimi gösteren ekran görüntüsü', evidenceAltEn: 'Screenshot showing two P1 submissions accepted for the NASA target on Bugcrowd on 13 August 2026', evidenceWidth: 1788, evidenceHeight: 474 },
    { title: 'University of Twente — 2026 Hall of Fame', titleEn: 'University of Twente — 2026 Hall of Fame', description: 'Sorumlu açıklama kapsamında kabul edilen 1 güvenlik raporu sonucunda “Basri Akkaya (realkage)” adıyla resmî Responsible Disclosure Hall of Fame kaydı.', descriptionEn: 'Official Responsible Disclosure Hall of Fame recognition as “Basri Akkaya (realkage)” for one accepted security report in 2026.', url: 'https://www.utwente.nl/en/cyber-safety/responsible/hall-of-fame/' },
    { title: 'Arçelik Türkiye — 2026 Hall of Fame', titleEn: 'Arçelik Türkiye — 2026 Hall of Fame', description: 'High önem seviyesinde (CVSS 7.5) raporlanan ve doğrulanan güvenlik bulgusu sonucunda “Basri Akkaya (realkage)” adıyla resmî Vulnerability Disclosure Hall of Fame kaydı.', descriptionEn: 'Official Vulnerability Disclosure Hall of Fame recognition as “Basri Akkaya (realkage)” following a validated security finding reported as High severity (CVSS 7.5).', url: 'https://www.arcelikglobal.com/en/vulnerability-disclosure-hall-of-fame/2026-vulnerability-disclosure-hall-of-fame/', findingTitle: 'Public Frontend İçerisindeki Sabit Credential Nedeniyle Kimlik Doğrulama Bypass’ı ve Yetkisiz API Erişimi', findingTitleEn: 'Hard-Coded Client-Side Credential Leads to Authentication Bypass and Unauthorized API Access', evidence: '/images/recognition/arcelik-hof-evidence.png', evidenceAlt: 'Arçelik 2026 Vulnerability Disclosure Hall of Fame listesinde Basri Akkaya (realkage) kaydını gösteren ekran görüntüsü', evidenceAltEn: 'Screenshot showing Basri Akkaya (realkage) in the Arçelik 2026 Vulnerability Disclosure Hall of Fame list', evidenceWidth: 1216, evidenceHeight: 1294 },
    { title: 'Goce Delcev Üniversitesi — Hall of Fame', titleEn: 'Goce Delcev University — Hall of Fame', description: 'Sorumlu güvenlik açığı bildirimi çalışmasının Goce Delcev Üniversitesi tarafından tanınması.', descriptionEn: 'Recognition from Goce Delcev University for responsible vulnerability disclosure work.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7470684004795437056/' },
    { title: 'Rahim Usta Anadolu Lisesi — Hall of Fame', titleEn: 'Rahim Usta Anatolian High School — Hall of Fame', description: 'Sorumlu güvenlik açığı bildirimi sonucunda Rahim Usta Anadolu Lisesi tarafından verilen onur listesi kaydı.', descriptionEn: 'Hall of Fame recognition from Rahim Usta Anatolian High School for responsible vulnerability disclosure.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7457327912598257664/' },
    { title: 'SANS CTF — 4.’lük', titleEn: 'SANS CTF — 4th Place', description: 'Takım çalışması ve teknik problem çözme odaklı CTF derecesi.', descriptionEn: 'A fourth-place CTF result focused on teamwork and technical problem solving.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7389336723224170496/' },
    { title: 'Being Wise CTF — 4.’lük', titleEn: 'Being Wise CTF — 4th Place', description: 'Uygulamalı güvenlik yarışmasında elde edilen derece.', descriptionEn: 'A fourth-place result in a hands-on cybersecurity competition.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7404273673664393216/' },
  ],
  recognition: [],
  community: {
    name: 'BugHane Academy',
    description: 'Yöneticisi olduğum, siber güvenlik meraklılarının bilgi ve deneyim paylaştığı topluluk ve forum.',
    website: 'https://bughaneacademy.com/',
    youtube: 'https://www.youtube.com/@BughaneAcademy',
  },
} as const;

export const absoluteUrl = (path = '/') => new URL(path, siteConfig.siteUrl).toString();
