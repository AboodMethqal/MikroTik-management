const D = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'dev.db');
const db = new D(dbPath, { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
console.log('TABLES:' + tables.join(','));
console.log('COUNT:' + tables.length);
for (const t of ['routers','admin_users','local_cards','sales','ledger_entries','card_templates','daily_reports','session_snapshots','point_of_sales','distribution_points','system_notifications']) {
  try {
    const c = db.prepare('SELECT COUNT(*) AS c FROM "' + t + '"').get();
    console.log(t + '=' + c.c);
  } catch (e) { console.log(t + '=MISSING'); }
}
db.close();
