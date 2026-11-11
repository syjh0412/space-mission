/**
 * 팽창하는 우주 탐구실 — 학생 기록을 내 구글 시트에 모으는 Apps Script
 * (재미있는 과학수업 만들기 공유용)
 *
 * 1) 새 구글 시트를 만들고 [확장 프로그램 > Apps Script]를 엽니다.
 * 2) 원래 있던 코드를 모두 지우고 이 코드를 통째로 붙여 넣습니다.
 * 3) 아래 PIN을 나만 아는 숫자로 바꾸고 저장합니다. (선생님 화면 비밀번호)
 * 4) [배포 > 새 배포 > 유형: 웹 앱] 실행 사용자: 나 / 액세스 권한: 모든 사용자 → 배포
 * 5) 나오는 웹 앱 주소(…/exec)를 설정 안내 페이지에 붙여 넣어 학생용 링크를 만듭니다.
 *
 * 코드를 나중에 고칠 때는 [배포 > 배포 관리 > 연필(수정) > 버전: 새 버전 > 배포]로 하면 주소가 바뀌지 않아요.
 * 학생 기록은 이 시트의 '우주팽창' 탭에 날짜·반·모둠·번호마다 한 줄씩 저장됩니다.
 */
const PIN = '0000';   // ← 꼭 바꾸세요

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data && data.app === 'expand') return expPost_(data);
    return out_({ ok: false, error: '알 수 없는 요청' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = e.parameter || {};
  return expGet_(p);
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}


/* ================= 우주팽창 탐구실 ================= */
const EXP_SHEET = '우주팽창';
// [영문 키, 시트 머리글]
const EXP_FIELDS = [
  ['key', '키'], ['day', '날짜'], ['cls', '반'], ['grp', '모둠'], ['num', '번호'], ['members', '모둠원'], ['roles', '역할'],
  ['pred', '예측'], ['predWhy', '예측 까닭'],
  ['d12s', '1~2 작게(cm)'], ['d12b', '1~2 크게(cm)'], ['d12x', '1~2 더 크게(cm)'],
  ['d13s', '1~3 작게(cm)'], ['d13b', '1~3 크게(cm)'], ['d13x', '1~3 더 크게(cm)'],
  ['d23s', '2~3 작게(cm)'], ['d23b', '2~3 크게(cm)'], ['d23x', '2~3 더 크게(cm)'],
  ['sim', '시뮬레이터 발견'],
  ['t1', '토의1 거리 비교'], ['t2', '토의2 은하 사이 거리'], ['t3', '토의3 우주의 중심'], ['t4', '토의4 모형의 한계'],
  ['score', '개념 확인 점수'], ['answered', '푼 문제 수'], ['updated', '마지막 저장'],
  ['sum', '한 줄 정리'], ['where', '지금 보는 화면'], ['prog', '세부 진행(JSON)']
];

function expSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(EXP_SHEET);
  if (!s) s = ss.insertSheet(EXP_SHEET);
  if (s.getLastRow() === 0 || s.getLastColumn() < EXP_FIELDS.length) {
    s.getRange(1, 1, 1, EXP_FIELDS.length).setValues([EXP_FIELDS.map(function (f) { return f[1]; })]);
    s.setFrozenRows(1);
  }
  return s;
}

function expText_(v, isCls) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isCls ? (v.getMonth() + 1) + '-' + v.getDate() : Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return String(v === null || v === undefined ? '' : v);
}

// 같은 날·같은 학생이 다시 저장하면 그 줄을 고쳐 씀 (doPost의 잠금 안에서 실행됨)
function expPost_(d) {
  const cls = String(d.cls || '').slice(0, 10), grp = String(d.grp || '').slice(0, 5), num = String(d.num || '').slice(0, 5);
  if (!cls || !grp || !num) return out_({ ok: false, error: '반·모둠·번호 없음' });
  const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const key = day + '|' + cls + '|' + grp + '|' + num;
  d.key = key; d.day = day; d.cls = cls; d.grp = grp; d.num = num;
  d.updated = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const row = EXP_FIELDS.map(function (f) { return String(d[f[0]] === undefined ? '' : d[f[0]]).slice(0, 3000); });

  const s = expSheet_();
  const last = s.getLastRow();
  let target = last + 1;
  if (last > 1) {
    const keys = s.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) { target = i + 2; break; }
    }
  }
  const range = s.getRange(target, 1, 1, EXP_FIELDS.length);
  range.setNumberFormat('@');
  range.setValues([row]);
  return out_({ ok: true });
}

function expGet_(p) {
  // 학생용: 오늘 같은 반·같은 모둠 친구들이 입력한 풍선 측정값만 (PIN 필요 없음)
  if (p.mode === 'team') {
    const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    const st = expSheet_(), lr = st.getLastRow();
    if (lr < 2) return out_({ ok: true, rows: [] });
    const keys = ['num', 'updated', 'd12s', 'd12b', 'd12x', 'd13s', 'd13b', 'd13x', 'd23s', 'd23b', 'd23x'];
    const vs = st.getRange(2, 1, lr - 1, EXP_FIELDS.length).getValues();
    const rows = [];
    vs.forEach(function (v) {
      const o = {};
      EXP_FIELDS.forEach(function (f, i) { o[f[0]] = expText_(v[i], f[0] === 'cls'); });
      if (o.day === today && o.cls === String(p.cls) && String(o.grp) === String(p.grp)) {
        const r = {}; keys.forEach(function (k) { r[k] = o[k]; }); rows.push(r);
      }
    });
    return out_({ ok: true, rows: rows });
  }
  if (String(p.pin || '') !== PIN) return out_({ ok: false, error: 'PIN' });
  const day = p.day || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const s = expSheet_();
  const last = s.getLastRow();
  if (last < 2) return out_({ ok: true, rows: [] });
  const vals = s.getRange(2, 1, last - 1, EXP_FIELDS.length).getValues();
  const rows = [];
  vals.forEach(function (v) {
    const o = {};
    EXP_FIELDS.forEach(function (f, i) { o[f[0]] = expText_(v[i], f[0] === 'cls'); });
    if (o.day === day) rows.push(o);
  });
  return out_({ ok: true, rows: rows });
}
