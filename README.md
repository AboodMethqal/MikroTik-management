# Mikhmon Next — Methqal Tech Edition
# Mikhmon Next — إصدار مثقال تك

منصة احترافية لإدارة شبكات **MikroTik** و**Hotspot** و**User Manager**، وطباعة الكروت، ونقاط البيع (POS)، والتقارير، والمراقبة — **طوّرتها وخصّصتها ووسّعتها وتتولى صيانتها Methqal Tech / مثقال تك**.

> Professional MikroTik network management, Hotspot, User Manager, card printing, POS, reporting, monitoring, and network administration platform developed and maintained by Methqal Tech.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-dev-003B57?style=flat-square&logo=sqlite)
![License](https://img.shields.io/badge/License-GPL--2.0-green?style=flat-square)

---

## عن مثقال تك | About Methqal Tech

**مثقال تك (Methqal Tech)** علامة تقنية متخصصة في تطوير المواقع الإلكترونية وتطبيقات الجوال والأنظمة والبرمجيات والحلول الرقمية المخصصة: تطوير الويب، تطبيقات الموبايل، الأنظمة المخصصة، لوحات التحكم الإدارية، REST APIs والتكاملات، التطبيقات المعتمدة على قواعد البيانات، الحلول السحابية، وواجهات عربية RTL ومتعددة اللغات.

- المؤسس والمطور: **عبدالرحمن مثقال | Abdulrahman Methqal**
- الموقع الرسمي: <https://methqal-tech.vercel.app/>
- البريد: <aboodezmethqal7704@gmail.com>
- الهاتف: [+967770499151](tel:+967770499151)
- المستودع الرسمي لهذه النسخة: <https://github.com/AboodMethqal/MikroTik-management>

---

## عن هذا المشروع | About This Project

**Mikhmon Next — Methqal Tech Edition** هو الإصدار المُدار حاليًا من منصة إدارة شبكات MikroTik المبنية بـ **Next.js 16** و**React 19** و**TypeScript**، بواجهة عربية (RTL) حديثة.

- **Current edition developed and maintained by عبدالرحمن مثقال — Methqal Tech.**
- تم تطوير هذه النسخة وتخصيصها وتوسيعها وصيانتها بواسطة **Methqal Tech**، مع الحفاظ على نسب الأعمال الأصلية لأصحابها (انظر قسم الحقوق أدناه)، دون أي ادعاء حول التأليف التاريخي للشيفرات الخارجية.

### الحقوق والنسب (محفوظة كما هي)

- الفكرة والنسخة الأصلية **Mikhmon PHP** من إنشاء **Laksamadi Guko** — <https://github.com/laksa19> — الموقع: <https://laksa19.github.io>
- نسخة الويب **Mikhmon Next** (إعادة كتابة Next.js) نُسبت إلى **Kacalayar** — <https://github.com/kacalayar>
- الترخيص: **GNU General Public License v2.0** — نفس ترخيص مشروع Mikhmon الأصلي.
- علامة MikroTik وRouterOS مملوكتان لشركة MikroTik.

---

## الميزات | Features

### إدارة شبكات MikroTik | MikroTik Network Management

- إدارة عدة راوترات والتبديل بينها (Multi-Router) مع تخزين مشفّر لبيانات الدخول
- لوحة تحكم لحظية: الهوية، uptime، إصدار RouterOS، CPU، الذاكرة، القرص
- الواجهات (Interfaces) وحالة التشغيل
- عملاء الواي فاي/اللاسلكي (registration-table)
- حظر وفك حظر العملاء (IP Binding من نوع blocked)
- DHCP Leases
- PPP: الأسرار (Secrets) والملفات (Profiles) والاتصالات النشطة
- النظام: الجدولة (Scheduler)، السجلات (Logs)، إعادة التشغيل والإطفاء
- WebFig Launcher مع بديل فتح في تبويب جديد

### Hotspot

- المستخدمون: إضافة، تعديل، حذف، تفعيل/تعطيل، تصفير العدادات
- توليد الكروت بالجملة بخيارات مخصصة (بادئة، الطول، النوع)
- الاتصالات النشطة وفصل الجلسات
- ملفات المستخدمين (Profiles)
- المضيفون (Hosts): الكل / المصرّح / المتجاوَز
- IP Binding
- الكوكيز (Cookies)
- سجلات Hotspot والمستخدمين

### User Manager

- عرض المستخدمين والملفات (Profiles)
- إنشاء، حذف، تفعيل، تعطيل، تجديد (Renew) المستخدمين
- طباعة الكروت
- أرشفة محلية لحفظ الكروت حتى بعد حذفها من الراوتر

### إدارة الكروت والطباعة | Card Management & Printing

- أرشيف محلي للكروت مع البحث (اسم الكرت، السيريال، MAC، Profile)
- قوالب HTML/CSS مخصصة مع صورة خلفية وشبكة طباعة (أعمدة × صفوف) ومعاينة مباشرة
- الطباعة السريعة (Quick Print) وتوليد الفاوتشرات
- الطباعة عبر المتصفح والحفظ كـ PDF
- أرقام تسلسلية (Serial Numbers)
- تصدير TXT

### نقاط البيع والمبيعات | POS & Sales

- نقاط البيع (POS): الرصيد الافتتاحي، حد الائتمان، الحالات
- المبيعات: الأصناف، الكميات، الأسعار، الإجماليات
- الدفعات والديون والأرصدة المتبقية
- دفتر الأستاذ (Ledger) وكشوف الحساب
- الإلغاء (Void) والقيود المحاسبية المتسلسلة

### التقارير | Reports

- التقارير اليومية المحفوظة محليًا (المتصلون، الكروت، الجلسات، الاستهلاك، المبيعات)
- استهلاك العملاء حسب MAC/المستخدم
- تقارير المبيعات اليومية/الشهرية مع فلترة
- تصدير CSV والطباعة/PDF

### مراقبة الشبكة | Network Monitoring

- صحة الشبكة وعدد العملاء والاستهلاك (RX/TX)
- لقطات الجلسات (Session Snapshots) للتحليل التاريخي
- الإشعارات (Notifications) وقطع توزيع الإنترنت (Distribution Points) المرتبطة بمنافذ MikroTik

### النسخ الاحتياطي والاستعادة | Backup & Restore

- إنشاء نسخة احتياطية JSON (نقاط البيع، القوالب، الكروت، التقارير، اللقطات، نقاط التوزيع، الإشعارات)
- **لا تتضمن النسخة كلمات مرور الراوترات** — تُستثنى عمدًا لحماية البيانات
- استعادة انتقائية مع تحقق من سلامة النسخة

---

## التقنيات | Technology Stack

| الطبقة | التقنية |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Recharts, TanStack Table |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| ORM | Prisma 7 |
| Dev DB | SQLite (`@prisma/adapter-better-sqlite3`) |
| Prod DB | PostgreSQL (`@prisma/adapter-pg`, schema منفصل) |
| RouterOS | node-routeros (API port 8728) |
| Validation | Zod |

---

## المتطلبات | Requirements

- **Node.js 18+** (مُختبر على Node 22)
- **npm** (يُستخدم `package-lock.json` — لا حاجة لـ `--force`)
- راوتر **MikroTik RouterOS** مع تفعيل خدمة API (للتشغيل الكامل؛ العمل البرمجي لا يحتاجه)
- مستخدم RouterOS بصلاحيات API

---

## التثبيت | Installation

```bash
git clone https://github.com/AboodMethqal/MikroTik-management.git
cd MikroTik-management
npm install
```

> ملاحظة: أمر التشغيل التطويري يستخدم webpack (`next dev --webpack`) وهو الإعداد المعتمد في `package.json`.

---

## متغيرات البيئة | Environment Variables

```bash
cp .env.example .env
```

| المتغير | الوصف |
|---|---|
| `DATABASE_URL` | التطوير: `file:./dev.db` (SQLite). الإنتاج: رابط PostgreSQL (انظر `.env.production.postgresql.example`) |
| `AUTH_SECRET` | **مطلوب** — 32 حرفًا على الأقل. يُستخدم لتشفير بيانات الراوترات وكوكيز الجلسات. توليد: `openssl rand -base64 48` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | حساب التأسيس (bootstrap) — يُستخدم عند أول دخول فقط قبل إنشاء مستخدم قاعدة بيانات، ثم بدّله |
| `AUTH_TRUST_HOST` | التطوير المحلي: `true` (بدونه يرفض Auth.js v5 كل طلبات `/api/auth/*` بخطأ `UntrustedHost`). الإنتاج: اضبط `AUTH_URL` على نطاقك العام |

---

## قاعدة بيانات التطوير SQLite | SQLite Development Database

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

- يُنشأ ملف `dev.db` محليًا ويُتجاهل في git (خاص بكل بيئة).
- لا تحذف مجلد `prisma/migrations/` — الترحيلات المطبقة: `0001_sqlite_init` و`20261008_smart_creator_parity`.

## قاعدة بيانات الإنتاج PostgreSQL | PostgreSQL Production Database

- الـ schema الإنتاجي محفوظ منفصلًا في `prisma/schema.postgresql.prisma` مع ترحيلاته في `prisma/migrations-postgresql/`.
- مثال الإعداد: `.env.production.postgresql.example`.
- لا تستخدم schema الإنتاج أثناء التطوير/الاختبار المحلي — التطوير SQLite حصرًا.

---

## تشغيل التطبيق | Running the Application

```bash
npm run dev
```

ثم افتح <http://localhost:3000> (صفحة الدخول `/login`).

- بيانات الدخول الأولى: `ADMIN_USERNAME` / `ADMIN_PASSWORD` من ملف `.env` (حساب تأسيس فقط).
- بعد الدخول أنشئ مستخدمًا حقيقيًا من صفحة المستخدمين وبدّل كلمة مرور التأسيس.

## البناء والتحقق | Build and Verification

```bash
npm run typecheck   # فحص TypeScript — يجب أن يكون نظيفًا
npm run lint        # فحص ESLint — نظيف (تحذيرات موثقة فقط)
npm run build       # بناء الإنتاج: prisma generate + next build
npm start           # تشغيل نسخة الإنتاج
```

---

## إعداد MikroTik | MikroTik Configuration

تفعيل خدمة API على الراوتر:

```
/ip service set api disabled=no port=8728
```

للوصول عن بُعد (DDNS/IP عام):

```
/ip service set api address=0.0.0.0/0
```

إنشاء مستخدم API مخصص (موصى به — بأقل الصلاحيات اللازمة للوحدات المفعّلة):

```
/user add name=mikhmon password=yourpassword group=full
```

> قيّد الوصول إلى API على خادم التطبيق/VPN فقط.

---

## الأمان | Security

- كلمات مرور الراوترات **مشفّرة** (AES-256-GCM) قبل التخزين ولا تُعاد أبدًا في أي API.
- كلمات مرور الإداريين مخزّنة بصيغة **PBKDF2-SHA512** ولا تُكشف في الردود.
- أدوار وصلاحيات: `SUPER_ADMIN` / `ADMIN` / `NETWORK_ADMIN` / `SALES_MANAGER` / `CASHIER` / `VIEWER` مع فحص صلاحية في كل API.
- تحديد معدل الطلبات (Rate Limiting) على كل المسارات، وتشديد على العمليات الحساسة.
- تحقق من المدخلات بـ Zod في كل مسار كتابة.
- الجلسات: JWT بحد 12 ساعة، كوكيز `httpOnly` + `SameSite=strict`.
- رؤوس أمان (Security Headers) على كل الردود.
- **لا يوجد** أي مسار يُرجع بيانات اعتماد أو أسرار إلى الواجهة.

---

## الحالة الحالية | Current Status

آخر تحقق برمجي كامل (typecheck + lint + build + تشغيل فعلي واختبار HTTP حي):

| البند | الحالة |
|---|---|
| الاعتماديات (Dependencies) | GREEN — working |
| SQLite + Prisma + Migrations | GREEN — working |
| TypeScript | GREEN — 0 errors |
| ESLint | GREEN — 0 errors |
| Production Build (88 routes) | GREEN — passing |
| بدء التطبيق والصفحات والـ APIs | GREEN — verified over HTTP |
| تسجيل الدخول/الصلاحيات/التحقق | GREEN — verified (صحيح/خطأ/زائر) |
| MikroTik حقيقي / Hotspot / User Manager على العتاد | YELLOW — يتطلب عتادًا حقيقيًا |
| طابعة حقيقية | YELLOW — يتطلب بيئة طباعة |
| PostgreSQL الإنتاجي | YELLOW — خيار إنتاجي مستقبلي |

> لا توجد أخطاء برمجية معروفة متبقية. كل ما تبقى هو اختبار العتاد/البيئة الحقيقية.

---

## لقطات / تجربة | Screenshots / Demo

لا توجد لقطات مرفقة في هذا المستودع. للتجربة المحلية:

```bash
npm install && npx prisma migrate deploy && npm run dev
```

ثم افتح <http://localhost:3000>.

---

## التطوير والصيانة | Developed and Maintained By

**Developed, customized, extended, and maintained by Methqal Tech.**

**Current edition developed and maintained by عبدالرحمن مثقال — Methqal Tech.**

## التواصل | Contact

- Website: <https://methqal-tech.vercel.app/>
- Email: <aboodezmethqal7704@gmail.com>
- Phone: [+967770499151](tel:+967770499151)
- Repository: <https://github.com/AboodMethqal/MikroTik-management>
