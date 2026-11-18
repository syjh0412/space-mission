/* 우주 탐사 기획단 · 3차시 동료평가(받은 제안) 조회용 — Apps Script에 추가하는 코드
 *
 * 기존 doGet(e)에서 app==='mission' 을 처리하는 부분, 'mode===class' / 'mode===team' 이 있는 곳에
 * 아래 한 줄(분기)을 추가하고, 함수 missionInbox_ 를 붙여 넣은 뒤 '새 버전으로 배포'해요.
 *
 *   if (e.parameter.mode === 'inbox') return missionInbox_(e.parameter.cls, e.parameter.grp);
 *
 * 시트 구조: 'class/team' 처리 코드가 읽는 것과 같은 시트(탐사기획 탭)를 쓰세요.
 * 첫 줄(머리글)에 cls, grp, num, data 열이 있다고 가정했어요. 열 이름이 다르면 아래 H 에서 맞춰 주세요.
 */
function missionInbox_(cls, grp) {
  var sh = SpreadsheetApp.getActive().getSheetByName('탐사기획'); // 시트 탭 이름
  var v = sh.getDataRange().getValues();
  var head = v[0].map(String);
  var H = { cls: head.indexOf('cls'), grp: head.indexOf('grp'), num: head.indexOf('num'), data: head.indexOf('data') };
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][H.cls]) !== String(cls)) continue;
    if (String(v[i][H.grp]) === String(grp)) continue;        // 우리 모둠이 쓴 것은 제외
    var d; try { d = JSON.parse(v[i][H.data] || '{}'); } catch (err) { continue; }
    var c = ((d.s3 || {}).peer || {})[String(grp)];
    if (c && c.sent && c.ask) out.push({ grp: String(v[i][H.grp]), num: String(v[i][H.num]), type: c.type || '', text: c.ask });
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: out })).setMimeType(ContentService.MimeType.JSON);
}
