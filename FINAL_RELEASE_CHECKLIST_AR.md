# Mikhmon Next — Methqal Tech Edition
## قائمة الإغلاق البرمجي قبل الاختبار الميداني

هذه النسخة أغلقت الوظائف التي يمكن تنفيذها والتحقق من كودها داخل بيئة التطوير، مع إبقاء اختبار RouterOS الحقيقي كمرحلة تشغيلية أخيرة.

### إدارة ومراقبة الشبكة
- [x] إدارة أجهزة MikroTik متعددة.
- [x] قراءة موارد الراوتر CPU/RAM/Uptime/Storage/Version.
- [x] مراقبة Interfaces وحالة UP/DOWN.
- [x] قراءة RX/TX اللحظي والتراكمي.
- [x] مراقبة Wireless Registration Table.
- [x] عد العملاء اللاسلكيين حسب Interface عندما يعيد RouterOS اسم الواجهة.
- [x] مراقبة Hotspot Active.
- [x] حظر العميل عبر Hotspot IP Binding.
- [x] فك الحظر وإدارة قائمة العملاء المحظورين.
- [x] مدير قطع توزيع الإنترنت المرتبطة بالراوتر والمنفذ.
- [x] Network Health والتنبيهات CPU/RAM/Interfaces.
- [x] WebFig مع fallback للفتح في تبويب مستقل.

### Hotspot
- [x] Users.
- [x] Profiles.
- [x] إنشاء Bulk Users/Vouchers.
- [x] Enable/Disable/Delete/Reset.
- [x] Active Sessions وفصل المستخدم.
- [x] Hosts/Cookies/IP Binding.
- [x] تنظيف الكروت المنتهية مع معاينة قبل الحذف.

### User Manager
- [x] Users.
- [x] Profiles.
- [x] Add/Delete/Enable/Disable/Renew.
- [x] طباعة مستخدمي User Manager الأساسية.
- [x] صلاحيات مستقلة للوحدة.

### الطباعة
- [x] Quick Print.
- [x] Card Templates.
- [x] HTML/CSS templates.
- [x] Paper/Rows/Columns.
- [x] حماية قوالب HTML من script/javascript/event handlers/iframe.
- [x] RTL printing.
- [x] طباعة/حفظ PDF من المتصفح لكشوف الحساب.

### المبيعات ونقاط البيع
- [x] نقاط البيع.
- [x] المبيعات.
- [x] Sale Items.
- [x] Payments.
- [x] Credit Limit.
- [x] منع تجاوز الائتمان.
- [x] منع الدفع الزائد.
- [x] Ledger محاسبي.
- [x] Void/Refund مع قيود عكسية.
- [x] كشف حساب.
- [x] Audit trail للعمليات الحساسة.

### الأمان والتشغيل
- [x] Admin Users.
- [x] Roles/Permissions.
- [x] Rate limiting.
- [x] تشفير بيانات اتصال MikroTik.
- [x] عدم تسجيل الأسرار في Audit Log.
- [x] Backup/Restore.
- [x] حماية عمليات النظام الحساسة بالصلاحيات.
- [x] RTL وواجهة عربية.
- [x] Responsive UI.
- [x] فحص صياغة جميع ملفات TypeScript/TSX: ناجح.

## الاختبار الميداني المتبقي
لا يُعد هذا نقصًا في وظائف المشروع، وإنما تحقق يعتمد على البيئة الفعلية:

1. RouterOS 7 حقيقي.
2. User Manager مثبت ومفعل.
3. Wireless APs حقيقية للتأكد من ربط العميل بالـInterface.
4. WebFig داخل الشبكة/عبر VPN.
5. PostgreSQL حقيقي.
6. اختبار الطباعة الفعلية على الطابعة المستهدفة.
7. تشغيل `npm install` ثم `prisma generate`, `prisma migrate deploy`, `npm run lint`, `npm run typecheck`, `npm run build` في بيئة الإنترنت/CI التي تتوفر فيها dependencies.

## وضع قاعدة البيانات الحالي — مرحلة التجربة
- قاعدة البيانات الحالية: **SQLite**.
- لا حاجة لتثبيت PostgreSQL في مرحلة التجربة.
- ملف قاعدة البيانات الافتراضي: `prisma/dev.db` عند استخدام `DATABASE_URL="file:./dev.db"`.
- مخطط PostgreSQL محفوظ في `prisma/schema.postgresql.prisma` للانتقال إلى الإنتاج لاحقًا.
- نسخة PostgreSQL السابقة من migrations محفوظة في `prisma/migrations-postgresql/`.
- قبل الإنتاج يجب تنفيذ انتقال رسمي إلى PostgreSQL واختبار migrations على نسخة من بيانات الإنتاج، وليس تبديل المتغير فقط.
