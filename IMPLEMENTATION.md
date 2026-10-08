# Mikhmon Next — Smart Creator Production Upgrade

هذه النسخة هي تطوير مباشر للمشروع المرفوع، وليست مشروعًا منفصلًا.

## الوحدات المكتملة/المضافة

### إدارة الشبكة
- قراءة جميع Interfaces وحالتها.
- RX/TX اللحظي عبر `monitor-traffic`.
- عدادات RX/TX التراكمية من Interface counters.
- Wireless Registration Table مع دعم RouterOS WiFi الحديث ومحاولة API القديمة.
- Active Hotspot clients مع IP/MAC/server والاستهلاك.
- حظر وفك حظر العملاء عبر Hotspot IP Binding.
- تحديث تلقائي كل 10 ثوانٍ.

### Hotspot
- إدارة المستخدمين والملفات والجلسات والقواعد الحالية في المشروع.
- تجديد الكرت عبر Reset Counters + إعادة التفعيل من واجهة المستخدم.
- تنظيف الكروت المنتهية بناءً على `limit-uptime` بعد تأكيد المستخدم.
- الطباعة العادية وQR والقوالب الموجودة.

### User Manager
- قراءة المستخدمين والـProfiles.
- إنشاء المستخدمين.
- تفعيل/تعطيل/حذف.
- تجديد عبر `create-and-activate-profile`.
- طباعة بيانات المستخدمين.
- طبقة API معزولة حتى لا تختلط أوامر User Manager مع Hotspot.

### الطباعة
- قوالب HTML/CSS مخزنة في PostgreSQL.
- الورق، الصفوف، الأعمدة، الشعار والقوالب الحالية.
- صفحة قوالب منفصلة.
- تنظيف الكروت المنتهية مع تأكيد.

### المبيعات ونقاط البيع
- نقاط بيع وموزعون.
- مبيعات وبنود بيع.
- دفعات.
- حد ائتماني.
- منع البيع عند تجاوز الحد.
- منع الدفعة الأكبر من الرصيد.
- دفتر حركات مالي `LedgerEntry`.
- إلغاء البيع واسترداد البيع بقيود عكسية.
- كشف حساب HTML جاهز للطباعة/الحفظ PDF.
- أرقام مرجعية فريدة للمبيعات.
- معاملات PostgreSQL بمستوى `Serializable` في العمليات المالية الحساسة.

### الحسابات والصلاحيات
- حساب bootstrap من Environment.
- حسابات AdminUser في PostgreSQL.
- الأدوار: SUPER_ADMIN, ADMIN, NETWORK_ADMIN, SALES_MANAGER, CASHIER, VIEWER.
- صلاحيات للراوتر، الشبكة، Hotspot، User Manager، الطباعة، POS والمبيعات.
- منع تعطيل مستخدم DB ثم تجاوز المنع عبر بيانات bootstrap عند وجود المستخدم في DB.

### التدقيق والأمان
- Audit Log للعمليات الحساسة.
- كلمات مرور MikroTik مشفرة أثناء التخزين.
- عدم إرجاع كلمة مرور الراوتر في API.
- Cookie الجلسة الخاصة بالراوتر HttpOnly وSecure في الإنتاج وSameSite=Strict.
- Rate limiting على عمليات القراءة والكتابة والحساسة.
- منع `admin/admin` الافتراضي.
- `AUTH_SECRET` إلزامي وطويل.
- كلمات مرور حسابات النظام مخزنة كـPBKDF2 hash.
- Security headers.

### WebFig
- محاولة تضمين WebFig.
- فتح في تبويب مستقل كخيار موثوق عند منع WebFig داخل iframe بسبب CSP/X-Frame أو mixed content.
- لا يتم تمرير كلمة مرور MikroTik إلى iframe.

### النسخ الاحتياطي
- تصدير إعدادات التطبيق، نقاط البيع، السجلات، القوالب وبيانات المبيعات.
- لا يتم تصدير كلمة مرور MikroTik كنص صريح.
- استعادة آمنة لنقاط البيع والقوالب.
- لا يتم استبدال السجل المالي تلقائيًا أثناء الاستعادة.

## قاعدة البيانات

Migration أساسي:

`prisma/migrations/20261008_network_pos_upgrade/migration.sql`

Migration الإنتاج:

`prisma/migrations/20261008_production_hardening/migration.sql`

الـProduction migration يضيف الحسابات والأدوار ودفتر الحركات وعمليات الإلغاء/الاسترداد وسجلات التدقيق.

## التعريب وRTL

- `html lang="ar" dir="rtl"`.
- اتجاه عام RTL في CSS.
- شاشة الدخول والقائمة والوحدات الجديدة بالعربية.
- أسماء MikroTik وRouterOS وWebFig وHotspot وUser Manager تبقى بأسمائها التقنية عند الحاجة حتى لا يحدث التباس في أوامر النظام.

## فحص الإنتاج

في بيئة متصلة بالشبكة:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

ثم يجب تنفيذ اختبار فعلي على RouterOS 7 وUser Manager وHotspot وواجهة لاسلكية حقيقية.
