const envSite = import.meta.env.SITE_URL?.trim();
const siteUrl = envSite || 'https://example.com';
const isPreview = import.meta.env.VERCEL_ENV === 'preview';

export const siteConfig = {
  name: 'Basri Akkaya',
  shortName: 'Basri',
  role: 'Computer Engineering Student & Security Researcher',
  headline: 'Ethical Hacker | Network & Web Pentester | Linux Enthusiast',
  motto: 'Cybersecurity is not a hobby, it’s a responsibility.',
  email: 'real0kage@protonmail.com',
  linkedin: 'https://www.linkedin.com/in/basriakkaya/',
  youtube: 'https://www.youtube.com/@basrikkya',
  github: undefined as string | undefined,
  locale: 'tr-TR',
  language: 'tr',
  siteUrl,
  indexable: !isPreview && siteUrl === 'https://basriakkaya.com',
  defaultImage: '/images/security-researcher.png',
  defaultTitle: 'Basri Akkaya — Security Researcher',
  description: "Basri Akkaya'nın siber güvenlik, web uygulama güvenliği, responsible disclosure ve yazılım geliştirme üzerine kişisel blogu.",
  heroCopy: 'Günümün büyük bölümünü bilgisayar başında; web güvenliği, application security ve güvenlik araştırmalarıyla geçiriyorum. Spam ve scam ağlarını bulup raporlamak, internetin biraz daha temiz kalmasına katkı sağlamak işin en sevdiğim tarafı.',
  about: 'Bilgisayar mühendisliği öğrencisiyim; web güvenliği, application security, pentest ve responsible disclosure odağında çalışıyorum. Binlerce kötü niyetli siteyi raporladım. Güvenliği yalnızca teknik bir uğraş değil, sonuçları olan bir sorumluluk olarak görüyorum.',
  focus: ['Web Security', 'Application Security', 'Pentest', 'Responsible Disclosure', 'Security Research', 'Linux'],
  cves: [
    { id: 'CVE-2026-52662', url: 'https://www.cve.org/CVERecord?id=CVE-2026-52662' },
    { id: 'CVE-2026-16323', url: 'https://www.cve.org/CVERecord?id=CVE-2026-16323' },
  ],
  achievements: [
    { title: 'University Hall of Fame', description: 'Responsible disclosure çalışmasının üniversite tarafından tanınması.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7470684004795437056/' },
    { title: 'Rual Hall of Fame', description: 'Güvenlik bildirimiyle kazanılan Hall of Fame kaydı.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7457327912598257664/' },
    { title: 'SANS CTF — 4.’lük', description: 'Takım çalışması ve teknik problem çözme odaklı CTF derecesi.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7389336723224170496/' },
    { title: 'Being Wise CTF — 4.’lük', description: 'Uygulamalı güvenlik yarışmasında elde edilen derece.', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7404273673664393216/' },
  ],
  recognition: [
    { title: 'Goce Delcev University', description: 'Güvenlik çalışmaları için resmî takdir mektubu.', url: 'https://fi.ugd.edu.mk/%d1%81%d1%82%d1%83%d0%b4%d0%b5%d0%bd%d1%82-%d0%bd%d0%b0-%d1%84%d0%b0%d0%ba%d1%83%d0%bb%d1%82%d0%b5%d1%82-%d0%b7%d0%b0-%d0%b8%d0%bd%d1%84%d0%be%d1%80%d0%bc%d0%b0%d1%82%d0%b8%d0%ba%d0%b0-%d0%be%d1%82/' },
    { title: 'Rahim Usta Anadolu Lisesi', description: 'Güvenlik çalışmaları için resmî takdir mektubu.', url: undefined },
  ],
  community: {
    name: 'BugHane Academy',
    description: 'Yöneticisi olduğum, siber güvenlik meraklılarının bilgi ve deneyim paylaştığı topluluk ve forum.',
    website: 'https://bughaneacademy.com/',
    youtube: 'https://www.youtube.com/@BughaneAcademy',
  },
} as const;

export const absoluteUrl = (path = '/') => new URL(path, siteConfig.siteUrl).toString();
