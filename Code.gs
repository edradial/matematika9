// Eksāmens 9 — runs as ai.skolens@gmail.com (standalone project, sheet in its Drive)
/**
 * Eksāmens 9: приём заявок с сайта в эту Google-таблицу (математика и естественные науки).
 *
 * Установка (5 минут):
 * 1. Создайте новую Google-таблицу (sheets.new), назовите её, например, «Matemātika 9 — заявки».
 * 2. Меню «Расширения» → «Apps Script». Удалите всё в Code.gs и вставьте этот файл целиком.
 * 3. Впишите ниже SITE_URL (адрес сайта) и OWNER_EMAIL (куда слать уведомления). Сохраните (Ctrl+S).
 * 4. «Развернуть» → «Новое развертывание» → тип «Веб-приложение».
 *    Выполнять как: «Я». У кого есть доступ: «Все». Нажмите «Развернуть» и разрешите доступ.
 * 5. Скопируйте URL веб-приложения (заканчивается на /exec) и вставьте его в CONFIG.endpoint на сайте.
 * Проверка: откройте этот URL в браузере, должно появиться «OK».
 * Если позже измените код: «Развернуть» → «Управление развертываниями» → карандаш → Версия: «Новая версия».
 */
const SITE_URL = '';          // например 'https://edradial.github.io/matematika9/'
const OWNER_EMAIL = '';       // ваш e-mail для уведомлений о новых заявках и бронях; пусто = без уведомлений
const REPORT_EMAIL = 'ai.skolens@gmail.com'; // куда приходят сообщения об ошибках с сайта
const BRAND = 'Eksāmens 9';
const SHEET = 'Заявки';
const DAILY_MAIL_LIMIT = 80;  // бесплатный Gmail даёт около 100 писем в день через Apps Script

// Ключ ответов и темы сгенерированы из сайта. Не меняйте вручную.
// По предмету: mat — математика, dab — естественные науки.
const SUBJ = {
  "mat": {
    "name": {
      "lv": "Matemātika",
      "ru": "математика"
    },
    "key": [
      1,
      2,
      0,
      1,
      3,
      0,
      1,
      3,
      1,
      0,
      2,
      0,
      3,
      2,
      3,
      2
    ],
    "qtopic": [
      "izt",
      "izt",
      "proc",
      "proc",
      "vien",
      "vien",
      "nev",
      "nev",
      "fun",
      "fun",
      "tri",
      "tri",
      "lauk",
      "lauk",
      "stat",
      "stat"
    ],
    "topics": {
      "izt": {
        "lv": "Pakāpes, saknes un izteiksmes",
        "ru": "Степени, корни и выражения"
      },
      "proc": {
        "lv": "Procenti un teksta uzdevumi",
        "ru": "Проценты и текстовые задачи"
      },
      "vien": {
        "lv": "Vienādojumi",
        "ru": "Уравнения"
      },
      "nev": {
        "lv": "Nevienādības",
        "ru": "Неравенства"
      },
      "fun": {
        "lv": "Funkcijas un grafiki",
        "ru": "Функции и графики"
      },
      "tri": {
        "lv": "Taisnleņķa trijstūris",
        "ru": "Прямоугольный треугольник"
      },
      "lauk": {
        "lv": "Laukumi, tilpumi un līdzība",
        "ru": "Площади, объёмы и подобие"
      },
      "stat": {
        "lv": "Statistika un varbūtība",
        "ru": "Статистика и вероятность"
      }
    }
  },
  "dab": {
    "name": {
      "lv": "Dabaszinātnes",
      "ru": "естественные науки"
    },
    "key": [
      2,
      1,
      0,
      3,
      2,
      0,
      1,
      3,
      3,
      1,
      0,
      2,
      1,
      3,
      0,
      2
    ],
    "qtopic": [
      "cilv",
      "cilv",
      "eko",
      "eko",
      "spek",
      "spek",
      "silt",
      "silt",
      "elek",
      "elek",
      "viel",
      "viel",
      "reak",
      "reak",
      "pet",
      "pet"
    ],
    "topics": {
      "cilv": {
        "lv": "Cilvēka organisms un veselība",
        "ru": "Организм человека и здоровье"
      },
      "eko": {
        "lv": "Organismi, vairošanās un ekosistēmas",
        "ru": "Организмы, размножение и экосистемы"
      },
      "spek": {
        "lv": "Spēki, svira un enerģija",
        "ru": "Силы, рычаг и энергия"
      },
      "silt": {
        "lv": "Siltums un vielas agregātstāvokļi",
        "ru": "Тепло и агрегатные состояния"
      },
      "elek": {
        "lv": "Elektrība",
        "ru": "Электричество"
      },
      "viel": {
        "lv": "Vielas, formulas un periodiskā tabula",
        "ru": "Вещества, формулы и таблица Менделеева"
      },
      "reak": {
        "lv": "Ķīmiskās reakcijas un aprēķini",
        "ru": "Химические реакции и расчёты"
      },
      "pet": {
        "lv": "Pētījums un dati",
        "ru": "Исследование и данные"
      }
    }
  }
};
const TOPICS = Object.assign({}, SUBJ.mat.topics, SUBJ.dab.topics);

const HEAD = ['ID', 'Создано', 'Обновлено', 'Этап', 'Язык', 'Кто', 'Имя', 'E-mail', 'Телефон', 'Новости', 'Баллы', 'Пробелы', 'Повторить', 'Ответы', 'Демо: решено', 'Бронь: темы', 'Бронь: €/мес', 'Источник', 'Кампания', 'Письмо с результатом', 'Что ещё нужно', 'Ест. науки: баллы', 'Ест. науки: пробелы', 'Ест. науки: повторить', 'Ест. науки: ответы', 'Ест. науки: письмо', 'Бронь: тариф'];
const STAGES = ['contact', 'results', 'demo', 'reserve', 'checkout'];
const EXTRA = ['survey'];     // добавляют данные в строку, но не двигают «Этап»
const NEEDS = { lv_exam: 'латышский', sci_exam: 'естественные науки', homework: 'домашка на латышском', grade12: '12 класс', other: 'другое' };

function doGet() { return ContentService.createTextOutput('OK'); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.stage === 'report') return report_(d);
    if (d.stage === 'withdraw') return withdraw_(d);
    if (d.stage === 'cheat') return cheat_(d);
    if (!/^[0-9a-f-]{36}$/i.test(d.id || '') || (STAGES.indexOf(d.stage) < 0 && EXTRA.indexOf(d.stage) < 0)) return out_({ ok: false });
    const sh = sheet_();
    const row = findRow_(sh, d.id);
    const now = new Date();
    const r = row ? sh.getRange(row, 1, 1, HEAD.length).getValues()[0] : HEAD.map(() => '');
    const col = name => HEAD.indexOf(name);
    const set = (name, v) => { r[col(name)] = v; };
    if (!row) { set('ID', d.id); set('Создано', now); }
    set('Обновлено', now);
    if (STAGES.indexOf(d.stage) > STAGES.indexOf(r[col('Этап')])) set('Этап', d.stage);
    if (d.lang === 'lv' || d.lang === 'ru') set('Язык', d.lang);

    if (d.stage === 'contact') {
      set('Кто', d.role === 'parent' ? 'родитель' : 'ученик');
      set('Имя', clip_(d.name, 60));
      if (validEmail_(d.email)) set('E-mail', clip_(d.email, 120));
      set('Телефон', clip_(d.phone, 30));
      set('Новости', d.news ? 'да' : 'нет');
      const u = d.utm || {};
      if (!r[col('Источник')]) set('Источник', clip_(u.utm_source, 60));
      if (!r[col('Кампания')]) set('Кампания', clip_(u.utm_campaign, 60));
    }
    if (d.stage === 'results') {
      const sj = d.subj === 'dab' ? 'dab' : 'mat', S = SUBJ[sj], code = String(d.code || '');
      if (new RegExp('^[0-4]{' + S.key.length + '}$').test(code)) {
        const res = score_(sj, code);
        const c = sj === 'dab' ? { a: 'Ест. науки: ответы', b: 'Ест. науки: баллы', g: 'Ест. науки: пробелы', m: 'Ест. науки: повторить', l: 'Ест. науки: письмо' }
          : { a: 'Ответы', b: 'Баллы', g: 'Пробелы', m: 'Повторить', l: 'Письмо с результатом' };
        const first = !r[col(c.b)];
        set(c.a, "'" + code);
        set(c.b, res.score + ' / ' + S.key.length);
        set(c.g, res.gap.map(id => TOPICS[id].ru).join(', '));
        set(c.m, res.mid.map(id => TOPICS[id].ru).join(', '));
        if (first && OWNER_EMAIL && canMail_()) {
          MailApp.sendEmail(OWNER_EMAIL, BRAND + ': результат теста (' + S.name.ru + ')',
            [r[col('Имя')], r[col('E-mail')], r[col('Кто')], S.name.ru + ': ' + res.score + ' / ' + S.key.length,
              'Пробелы: ' + (res.gap.map(id => TOPICS[id].ru).join(', ') || '—'), 'Повторить: ' + (res.mid.map(id => TOPICS[id].ru).join(', ') || '—'), r[col('Источник')]].filter(String).join('\n'));
        }
        const email = r[col('E-mail')];
        if (email && !r[col(c.l)] && canMail_()) {
          mailResults_(sj, email, r[col('Имя')], r[col('Кто')], r[col('Язык')] || 'lv', d.id, code, res);
          set(c.l, now);
        }
      }
    }
    if (d.stage === 'demo') set('Демо: решено', Math.max(0, Math.min(99, parseInt(d.solved, 10) || 0)));
    if (d.stage === 'reserve' || d.stage === 'checkout') {
      const ids = (Array.isArray(d.topics) ? d.topics : []).filter(id => TOPICS[id]);
      set('Бронь: темы', ids.map(id => TOPICS[id].ru).join(', '));
      set('Бронь: €/мес', Number(d.price) || '');
      set('Бронь: тариф', { month: 'помесячно', exam: 'до экзамена', both: 'оба предмета' }[d.plan] || '');
    }
    if (d.stage === 'survey') {
      const keys = (Array.isArray(d.needs) ? d.needs : []).filter(k => NEEDS.hasOwnProperty(k));
      const other = keys.indexOf('other') >= 0 && d.other ? ': ' + clip_(d.other, 120) : '';
      if (keys.length) set('Что ещё нужно', clip_(keys.map(k => NEEDS[k]).join(', ') + other, 300));
    }

    if (row) sh.getRange(row, 1, 1, HEAD.length).setValues([r]); else sh.appendRow(r);

    const notify = (d.stage === 'contact' && !row) || d.stage === 'reserve';
    if (OWNER_EMAIL && notify && canMail_()) {
      MailApp.sendEmail(OWNER_EMAIL, BRAND + ': ' + (d.stage === 'reserve' ? 'новая бронь' : 'новая заявка'),
        [r[col('Имя')], r[col('E-mail')], r[col('Кто')], r[col('Бронь: темы')], r[col('Бронь: €/мес')] ? r[col('Бронь: €/мес')] + ' €/мес' : '', r[col('Источник')]].filter(String).join('\n'));
    }
    return out_({ ok: true });
  } catch (err) {
    console.error(err);
    return out_({ ok: false });
  } finally {
    try { lock.releaseLock(); } catch (e2) { }
  }
}

function withdraw_(d) {
  const name = clip_(d.name, 80), contract = clip_(d.contract, 400), email = validEmail_(d.email) ? d.email : '';
  if (name.length < 3 || contract.length < 3 || !email) return out_({ ok: false });
  const ss = ss_();
  let sh = ss.getSheetByName('Atteikumi');
  if (!sh) { sh = ss.insertSheet('Atteikumi'); sh.getRange(1, 1, 1, 7).setValues([['Saņemts', 'Vārds', 'E-pasts', 'Līgums', 'Valoda', 'Konts', 'Apstiprinājums nosūtīts']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  const now = new Date(), when = Utilities.formatDate(now, 'Europe/Riga', 'dd.MM.yyyy HH:mm') + ' (Rīgas laiks)';
  const ru = d.lang === 'ru';
  const body = (ru ? 'Здравствуйте, ' : 'Labdien, ') + name + '!\n\n' +
    (ru ? 'Мы получили ваш отказ от договора с Eksāmens 9.' : 'Esam saņēmuši jūsu atteikumu no līguma ar Eksāmens 9.') + '\n\n' +
    (ru ? 'Содержание отказа: ' : 'Atteikuma saturs: ') + contract + '\n' +
    (ru ? 'Дата и время подачи: ' : 'Iesniegšanas datums un laiks: ') + when + '\n\n' +
    (ru ? 'Деньги вернём не позднее чем через 14 дней тем же способом оплаты.' : 'Naudu atmaksāsim ne vēlāk kā 14 dienu laikā, izmantojot to pašu maksājuma veidu.') + '\n\n' +
    'Eksāmens 9 · www.eksamens9.lv · ' + (REPORT_EMAIL || OWNER_EMAIL);
  let sent = '';
  if (canMail_()) {
    MailApp.sendEmail({ to: email, subject: (ru ? 'Подтверждение отказа от договора' : 'Atteikuma apstiprinājums') + ' — ' + BRAND, body: body, name: BRAND, replyTo: REPORT_EMAIL || OWNER_EMAIL });
    sent = now;
    if (REPORT_EMAIL || OWNER_EMAIL) MailApp.sendEmail(REPORT_EMAIL || OWNER_EMAIL, BRAND + ': atteikums no līguma', name + ' <' + email + '>\n' + contract + '\n' + when + (d.user ? '\nKonts: ' + clip_(d.user, 60) : ''));
  }
  sh.appendRow([now, name, email, contract, ru ? 'ru' : 'lv', clip_(d.user, 60), sent]);
  return out_({ ok: true });
}

function report_(d) {
  const msg = clip_(d.msg, 1500);
  if (msg.length < 3) return out_({ ok: false });
  const ss = ss_();
  let sh = ss.getSheetByName('Ошибки');
  if (!sh) { sh = ss.insertSheet('Ошибки'); sh.getRange(1, 1, 1, 7).setValues([['Когда', 'Язык', 'Где', 'Сообщение', 'E-mail', 'Страница', 'Браузер']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  const email = validEmail_(d.email) ? d.email : '';
  sh.appendRow([new Date(), d.lang === 'ru' ? 'ru' : 'lv', clip_(d.ctx, 60), msg, email, clip_(d.url, 200), clip_(d.ua, 200)]);
  if ((REPORT_EMAIL || OWNER_EMAIL) && canMail_()) {
    const opt = { to: REPORT_EMAIL || OWNER_EMAIL, subject: BRAND + ': ошибка на сайте (' + clip_(d.ctx, 40) + ')', name: BRAND,
      body: msg + '\n\n— ' + clip_(d.ctx, 60) + '\n' + clip_(d.url, 200) + '\n' + (d.lang === 'ru' ? 'ru' : 'lv') + (email ? '\nОтвет: ' + email : '') };
    if (email) opt.replyTo = email;
    MailApp.sendEmail(opt);
  }
  return out_({ ok: true });
}

function score_(sj, code) {
  const S = SUBJ[sj], ids = Object.keys(S.topics), per = {};
  ids.forEach(id => { per[id] = { c: 0, n: 0 }; });
  code.split('').forEach((ch, i) => { const t = S.qtopic[i]; per[t].n++; if (Number(ch) === S.key[i]) per[t].c++; });
  return {
    per,
    score: ids.reduce((s, id) => s + per[id].c, 0),
    gap: ids.filter(id => per[id].c === 0),
    mid: ids.filter(id => per[id].c > 0 && per[id].c < per[id].n),
  };
}

function mailResults_(sj, to, name, who, lang, id, code, res) {
  const ru = lang === 'ru', S = SUBJ[sj], KEY = S.key;
  const ids = Object.keys(S.topics);
  const rank = i => (res.per[i].c === 0 ? 0 : res.per[i].c < res.per[i].n ? 1 : 2);
  const label = [ru ? 'пробел' : 'robs', ru ? 'повторить' : 'jāatkārto', ru ? 'хорошо' : 'labi'];
  const color = ['#B42F39', '#9A5B00', '#11744F'];
  const rows = ids.slice().sort((a, b) => rank(a) - rank(b)).map(i =>
    '<tr><td style="padding:8px 12px;border-bottom:1px solid #E3E8F0">' + esc_(TOPICS[i][ru ? 'ru' : 'lv']) + '</td>' +
    '<td style="padding:8px 12px;border-bottom:1px solid #E3E8F0;color:' + color[rank(i)] + ';font-weight:700">' + label[rank(i)] + '</td></tr>').join('');
  const link = SITE_URL ? SITE_URL + (SITE_URL.indexOf('?') < 0 ? '?' : '&') + 'id=' + id + '&s=' + sj + '&r=' + code + '&l=' + lang + '#demo' : '';
  const hi = ru ? (who === 'родитель' ? 'Здравствуйте' : 'Привет') : 'Sveiki';
  const subject = (ru ? 'Результат теста — ' + S.name.ru + ': ' + res.score + ' из ' : S.name.lv + ': testa rezultāts ' + res.score + ' no ') + KEY.length;
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#14213A;max-width:560px">' +
    '<p>' + hi + (name ? ', ' + esc_(name) : '') + '!</p>' +
    '<p style="font-size:20px"><b>' + (ru ? 'Результат: ' : 'Rezultāts: ') + res.score + (ru ? ' из ' : ' no ') + KEY.length + '</b></p>' +
    '<table style="border-collapse:collapse;width:100%;margin:8px 0 16px">' + rows + '</table>' +
    (link ? '<p><a href="' + link + '" style="display:inline-block;background:#2448C4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">' +
      (ru ? 'Открыть демо-курс' : 'Atvērt demo kursu') + '</a></p>' : '') +
    '<p style="color:#56647C">' + (ru ? 'Это не оценка за экзамен: результат показывает, с каких тем начать.' : 'Šis nav eksāmena vērtējums: tas parāda, ar kurām tēmām sākt.') + '</p>' +
    '<p style="color:#8A96AB;font-size:13px">' + (ru ? 'Вы получили это письмо, потому что прошли тест на сайте ' + BRAND + '. Чтобы удалить ваши данные, просто ответьте на это письмо.'
      : 'Šo e-pastu saņēmi, jo izpildīji testu vietnē ' + BRAND + '. Ja vēlies, lai tavus datus dzēšam, atbildi uz šo e-pastu.') + '</p></div>';
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: BRAND });
}

function sheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < HEAD.length) {
    // таблица создана старой версией скрипта: дописываем новые столбцы в шапку
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
  }
  return sh;
}
function findRow_(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const f = sh.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}
function canMail_() {
  const p = PropertiesService.getScriptProperties();
  const k = 'mail_' + Utilities.formatDate(new Date(), 'Europe/Riga', 'yyyyMMdd');
  const n = Number(p.getProperty(k) || 0);
  if (n >= DAILY_MAIL_LIMIT || MailApp.getRemainingDailyQuota() < 5) return false;
  p.setProperty(k, String(n + 1));
  return true;
}
function validEmail_(s) { return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120; }
function clip_(s, n) { return String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/^[=+\-@]/, "'$&").slice(0, n); }
function esc_(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function cheat_(d) {
  const email = validEmail_(d.email) ? String(d.email).trim().toLowerCase() : '';
  if (!email) return out_({ ok: false });
  const ss = ss_();
  let sh = ss.getSheetByName('Formulu lapa');
  if (!sh) { sh = ss.insertSheet('Formulu lapa'); sh.getRange(1, 1, 1, 7).setValues([['Saņemts', 'E-pasts', 'Valoda', 'Loma', 'Jaunumi', 'Avots', 'E-pasts nosūtīts']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  const n = sh.getLastRow(), seen = n > 1 && sh.getRange(Math.max(2, n - 999), 2, Math.min(999, n - 1), 1).getValues().some(r => r[0] === email);
  const ru = d.lang === 'ru', role = ['student', 'parent', 'teacher'].indexOf(d.role) >= 0 ? d.role : 'student';
  const pdf = 'https://www.eksamens9.lv/formulu-lapa/eksamens9-formulas.pdf', test = 'https://www.eksamens9.lv/' + (ru ? '?l=ru' : '') + '#tests';
  let sent = '';
  if (!seen && canMail_()) {
    const html = ru
      ? '<p>Здравствуйте!</p><p>Вот ваша шпаргалка формул к экзаменам 9 класса (математика и естественные науки, 2 страницы A4):</p><p><a href="' + pdf + '"><b>Скачать PDF</b></a></p><p>Хотите узнать, какие темы повторить? Пройдите бесплатный тест — 16 задач, результат по темам: <a href="' + test + '">пройти тест</a>.</p><p>Удачи на экзаменах!<br>Eksāmens 9 · www.eksamens9.lv</p>'
      : '<p>Labdien!</p><p>Lūk, tava formulu lapa 9. klases eksāmeniem (matemātika un dabaszinātnes, 2 lapas A4):</p><p><a href="' + pdf + '"><b>Lejupielādēt PDF</b></a></p><p>Gribi uzzināt, kuras tēmas atkārtot? Izpildi bezmaksas testu — 16 uzdevumi, rezultāts pa tēmām: <a href="' + test + '">pildīt testu</a>.</p><p>Veiksmi eksāmenos!<br>Eksāmens 9 · www.eksamens9.lv</p>';
    MailApp.sendEmail({ to: email, subject: (ru ? 'Шпаргалка формул' : 'Formulu lapa') + ' — ' + BRAND, htmlBody: html, body: (ru ? 'Шпаргалка: ' : 'Formulu lapa: ') + pdf, name: BRAND, replyTo: REPORT_EMAIL || OWNER_EMAIL });
    sent = new Date();
  }
  sh.appendRow([new Date(), email, ru ? 'ru' : 'lv', role, d.news ? 'jā' : '', clip_(d.src, 120), sent]);
  return out_({ ok: true });
}

function ss_() {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('Eksāmens 9 — pieteikumi');
  p.setProperty('SHEET_ID', ss.getId());
  return ss;
}
