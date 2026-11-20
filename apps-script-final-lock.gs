/* 우주 탐사 기획단 · "개인 최종" 잠금/열기 — Apps Script에 추가하는 코드
 *
 * 목적: 선생님이 열어주기 전에는 학생이 '개인 최종' 활동지를 열 수 없게 합니다.
 * 반(cls)별로 열림/잠김 상태를 저장하고, 학생 화면은 수시로 이 상태를 물어봐요.
 *
 * ── 넣는 방법 ──
 * 1) 아래 TEACHER_PIN 값을 선생님 화면(#teacher)에서 쓰는 PIN과 똑같이 맞춰 주세요.
 * 2) 기존 doGet(e) 함수 안, app==='mission' 을 처리하는 분기 근처에 아래 한 줄을 추가하세요.
 *    (PIN 없이도 상태를 읽을 수 있어야 학생이 조회할 수 있으니, PIN 검사 바깥쪽에 두세요.)
 *
 *      if (e.parameter.mode === 'finalLock') return finalLockStatus_(e.parameter.cls);
 *
 * 3) 기존 doPost(e) 함수 안, JSON.parse(e.postData.contents) 로 data를 만든 뒤
 *    data.app 값으로 분기하는 곳에 아래 한 줄을 추가하세요.
 *
 *      if (data.app === 'finalLock') return finalLockSet_(data);
 *
 * 4) 이 파일의 두 함수(finalLockStatus_, finalLockSet_)와 TEACHER_PIN 상수를
 *    프로젝트의 Code.gs 아무 곳에나 붙여넣고 '새 버전으로 배포'하세요.
 *
 * 저장 방식: 시트를 쓰지 않고 스크립트 속성(PropertiesService)에 반별 열림 상태를
 * JSON으로 저장해요. 기존 시트 구조를 바꾸지 않습니다.
 */

var TEACHER_PIN = '0000'; // 선생님 화면의 PIN과 반드시 똑같이 맞춰 주세요

function finalLockStatus_(cls) {
  var raw = PropertiesService.getScriptProperties().getProperty('finalLock');
  var map = raw ? JSON.parse(raw) : {};
  var open = !!map[String(cls)];
  return ContentService.createTextOutput(JSON.stringify({ ok: true, open: open })).setMimeType(ContentService.MimeType.JSON);
}

function finalLockSet_(data) {
  if (String(data.pin) !== TEACHER_PIN) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'PIN' })).setMimeType(ContentService.MimeType.JSON);
  }
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('finalLock');
  var map = raw ? JSON.parse(raw) : {};
  map[String(data.cls)] = !!data.open;
  props.setProperty('finalLock', JSON.stringify(map));
  return ContentService.createTextOutput(JSON.stringify({ ok: true, open: map[String(data.cls)] })).setMimeType(ContentService.MimeType.JSON);
}
