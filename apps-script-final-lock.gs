/* 우주 탐사 기획단 · "개인 최종" 잠금/열기 — 참고용 (이미 Apps Script 프로젝트에 적용·배포됨)
 *
 * 2026-11-20에 Claude가 Apps Script 프로젝트(우리은하 천체 탐험대 공용 Code.gs)에
 * 직접 아래 내용을 추가하고 새 버전으로 배포했습니다. 이 파일은 이 저장소 쪽에서
 * 무엇이 바뀌었는지 기록해 두는 참고용이며, 실제로 다시 붙여넣을 필요는 없습니다.
 * (나중에 Code.gs를 손으로 복구해야 할 일이 생기면 아래 내용을 그대로 쓰면 됩니다.)
 *
 * 반(cls)별 열림 상태를 시트가 아니라 PropertiesService(스크립트 속성)에 저장해요.
 * PIN은 기존 선생님 PIN(코드 상단의 const PIN)을 그대로 재사용합니다 — 별도 PIN 없음.
 *
 * doGet(e) 안, app==='mission' 분기 바로 아래에 추가됨:
 *   if (p.app === 'finalLock') return finLockGet_(p);
 *
 * doPost(e) 안, app==='missionScore' 분기 바로 아래에 추가됨:
 *   if (data && !Array.isArray(data) && data.app === 'finalLock') return finLockSet_(data);
 *
 * 파일 맨 끝에 추가된 함수:
 */

function finLockGet_(p) {
  const raw = PropertiesService.getScriptProperties().getProperty('finalLock');
  const map = raw ? JSON.parse(raw) : {};
  return out_({ ok: true, open: !!map[String(p.cls)] });
}
function finLockSet_(data) {
  if (String(data.pin || '') !== PIN) return out_({ ok: false, error: 'PIN' });
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('finalLock');
  const map = raw ? JSON.parse(raw) : {};
  map[String(data.cls)] = !!data.open;
  props.setProperty('finalLock', JSON.stringify(map));
  return out_({ ok: true, open: map[String(data.cls)] });
}

/* 클라이언트(index.html) 쪽 호출 방식:
 *   GET  {GAS_URL}?app=finalLock&cls=2-1                       → { ok:true, open:true/false }
 *   POST { app:'finalLock', pin:'<선생님 PIN>', cls:'2-1', open:true }
 */
