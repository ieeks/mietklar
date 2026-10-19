import { STORAGE_KEY, MAX_BACKUP_BYTES, makeSnapshot, parseSnapshot, writeSavedSnapshot, removeSavedSnapshot } from './persistence.js?v=0.7.0-alpha.3';

export function setupPersistence({ root, tariffYear, captureState, applyState, refresh, isValid }) {
  const doc = root.ownerDocument, win = doc.defaultView;
  const q = selector => root.querySelector(selector);
  let remember = false, timer = null, lastState = null, lastSavedAt = null;
  let hasSaved = false, blocked = false, recoveryText = null, undoState = null, importSequence = 0;
  const toggle = q('[data-remember]'), status = q('[data-storage-status]'), badge = q('[data-storage-badge]');
  const time = iso => new Intl.DateTimeFormat('de-AT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  const cancel = () => { if (timer !== null) win.clearTimeout(timer); timer = null; };
  const announce = (message, state = 'normal', label = remember ? 'An' : 'Aus') => {
    status.textContent = message; status.dataset.state = state; badge.textContent = label;
  };
  const updateControls = () => {
    toggle.checked = remember; toggle.disabled = blocked;
    q('[data-delete-saved]').disabled = !hasSaved;
    q('[data-recover-saved]').hidden = recoveryText === null;
    q('[data-undo-import]').hidden = undoState === null;
  };
  function saveNow(force = false) {
    cancel();
    if (!remember || blocked) return false;
    try {
      const state = captureState();
      const snapshot = makeSnapshot(state, tariffYear);
      const fingerprint = JSON.stringify(snapshot.state);
      if (!force && fingerprint === lastState && status.dataset.state !== 'error') return true;
      const saved = writeSavedSnapshot(win.localStorage, state, tariffYear, snapshot.savedAt);
      lastState = fingerprint; lastSavedAt = saved.savedAt; hasSaved = true;
      updateControls();
      announce((isValid() ? 'Gespeichert: ' : 'Entwurf gespeichert: ') + time(saved.savedAt)
        + (isValid() ? '.' : '. Einige Eingaben sind noch unvollständig oder ungültig.'));
      return true;
    } catch {
      announce('Speichern fehlgeschlagen. Deine aktuellen Eingaben bleiben in dieser Sitzung erhalten.'
        + (lastSavedAt ? ' Letzter gespeicherter Stand: ' + time(lastSavedAt) + '.' : '')
        + ' Du kannst eine Sicherungsdatei exportieren.', 'error', 'Fehler');
      return false;
    }
  }
  function scheduleSave() {
    cancel();
    if (remember && !blocked) timer = win.setTimeout(() => saveNow(), 400);
  }
  function download(raw, filename) {
    const url = win.URL.createObjectURL(new win.Blob([raw], { type: 'application/json;charset=utf-8' }));
    const a = doc.createElement('a'); a.href = url; a.download = filename;
    doc.body.append(a);
    try { a.click(); } finally { a.remove(); win.setTimeout(() => win.URL.revokeObjectURL(url), 1000); }
  }
  function deleteSaved() {
    cancel(); remember = false;
    try {
      removeSavedSnapshot(win.localStorage);
      hasSaved = false; blocked = false; recoveryText = null; lastState = null; lastSavedAt = null;
      announce('Lokaler Speicherstand gelöscht. Automatisches Speichern ist aus; deine aktuelle Sitzung bleibt erhalten.');
    } catch {
      announce('Der lokale Speicherstand konnte nicht gelöscht werden. Automatisches Speichern ist hier pausiert.'
        + ' Prüfe die Website-Daten in deinen Browsereinstellungen.', 'error', 'Fehler');
    }
    updateControls();
  }
  function applyWithRollback(state) {
    const before = captureState();
    try { applyState(state); return refresh(); }
    catch (error) { applyState(before); refresh(); throw error; }
  }
  function loadSaved() {
    let raw;
    try { raw = win.localStorage.getItem(STORAGE_KEY); }
    catch {
      blocked = true;
      announce('Dieser Browser erlaubt aktuell keine lokale Speicherung. Export und Import als Datei bleiben verfügbar.', 'error', 'Nicht verfügbar');
      updateControls(); return;
    }
    if (raw === null) { updateControls(); return; }
    hasSaved = true;
    try {
      const snapshot = parseSnapshot(raw, tariffYear);
      const migrated = JSON.parse(raw).schemaVersion < 3;
      const valid = applyWithRollback(snapshot.state);
      remember = true; lastState = JSON.stringify(snapshot.state); lastSavedAt = snapshot.savedAt;
      announce('Gespeicherter Stand geladen: ' + time(snapshot.savedAt)
        + (valid ? '.' : '. Bitte die unvollständigen oder ungültigen Eingaben prüfen.')
        + (migrated ? ' Ältere Sicherung übernommen; neue Leerstands- und Vergleichsfelder ergänzt. Bisherige Werte bleiben erhalten.' : ''));
    } catch (error) {
      blocked = true; recoveryText = raw;
      announce('Gespeicherter Stand nicht geladen: ' + error.message
        + ' Er bleibt unverändert erhalten. Du kannst ihn herunterladen oder lokal löschen.', 'error', 'Nicht geladen');
    }
    updateControls();
  }
  toggle.checked = false; toggle.disabled = false;
  q('[data-export-backup]').disabled = false; q('[data-import-backup]').disabled = false;
  toggle.addEventListener('change', () => {
    if (!toggle.checked) { deleteSaved(); return; }
    remember = true;
    if (!saveNow(true)) remember = false;
    updateControls();
  });
  q('[data-delete-saved]').addEventListener('click', deleteSaved);
  q('[data-export-backup]').addEventListener('click', () => {
    try {
      const snapshot = makeSnapshot(captureState(), tariffYear);
      download(JSON.stringify(snapshot, null, 2), 'mietklar-sicherung-' + snapshot.savedAt.slice(0, 10) + '.json');
      announce('Sicherung zum Herunterladen bereitgestellt. ' + (remember ? 'Lokale Speicherung bleibt an.' : 'Lokale Speicherung bleibt aus.'));
    } catch (error) { announce('Export nicht möglich: ' + error.message, 'error', 'Fehler'); }
  });
  q('[data-recover-saved]').addEventListener('click', () => {
    if (recoveryText === null) return;
    try { download(recoveryText, 'mietklar-nicht-geladener-speicherstand.json'); }
    catch { announce('Download des vorhandenen Speicherstands nicht möglich.', 'error', 'Fehler'); }
  });
  const fileInput = q('[data-import-file]');
  q('[data-import-backup]').addEventListener('click', () => fileInput.click());
  const readFile = file => typeof file.text === 'function' ? file.text() : new Promise((resolve, reject) => {
    const reader = new win.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsText(file);
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]; if (!file) return;
    const sequence = ++importSequence;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new RangeError('Datei ist größer als 256 KB.');
      const raw = await readFile(file);
      if (sequence !== importSequence) return;
      const snapshot = parseSnapshot(raw, tariffYear);
      const migrationNote = JSON.parse(raw).schemaVersion < 3 ? ' Ältere Sicherung übernommen; neue Leerstands- und Vergleichsfelder ergänzt. Bisherige Werte bleiben erhalten.' : '';
      const before = captureState();
      cancel();
      const valid = applyWithRollback(snapshot.state);
      undoState = before; updateControls();
      if (remember) {
        if (saveNow(true)) announce('Sicherung importiert und lokal gespeichert.' + migrationNote + (valid ? '' : ' Bitte die noch ungültigen Eingaben prüfen.'));
      } else {
        announce('Sicherung importiert. Lokale Speicherung bleibt aus.'
          + migrationNote
          + (blocked ? ' Der bisher nicht geladene Speicherstand bleibt erhalten.' : '')
          + (valid ? '' : ' Bitte die noch ungültigen Eingaben prüfen.'));
      }
    } catch (error) {
      if (sequence === importSequence) announce('Import nicht übernommen: ' + error.message + ' Deine aktuellen Eingaben bleiben unverändert.', 'error', 'Importfehler');
    } finally {
      if (sequence === importSequence) fileInput.value = '';
    }
  });
  q('[data-undo-import]').addEventListener('click', () => {
    if (undoState === null) return;
    cancel();
    try {
      applyWithRollback(undoState); undoState = null; updateControls();
      if (!remember || saveNow(true)) announce('Letzten Import rückgängig gemacht. ' + (remember ? 'Vorheriger Stand wieder gespeichert.' : 'Lokale Speicherung bleibt aus.'));
    } catch { announce('Import konnte nicht rückgängig gemacht werden.', 'error', 'Fehler'); }
  });
  const flush = () => { if (remember && timer !== null) saveNow(); };
  win.addEventListener('pagehide', flush);
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden') flush(); });
  win.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== win.localStorage) return; } catch { return; }
    cancel(); remember = false; lastState = null; lastSavedAt = null;
    hasSaved = event.newValue !== null;
    blocked = false; recoveryText = null;
    if (hasSaved) {
      try { parseSnapshot(event.newValue, tariffYear); }
      catch (error) {
        blocked = true; recoveryText = event.newValue;
        announce('Ein anderer Tab hat einen nicht lesbaren Speicherstand hinterlegt: ' + error.message
          + ' Er bleibt unverändert erhalten. Du kannst ihn herunterladen oder lokal löschen.', 'error', 'Nicht geladen');
        updateControls(); return;
      }
    }
    announce(event.newValue === null
      ? 'Lokale Speicherung wurde in einem anderen Tab gelöscht oder ausgeschaltet. Deine Sitzung bleibt erhalten.'
      : 'Ein anderer Tab hat den Speicherstand geändert. Speichern ist hier pausiert. Zum Laden die Seite neu öffnen; zum Überschreiben Speichern erneut einschalten.',
    'normal', event.newValue === null ? 'Aus' : 'Pausiert');
    updateControls();
  });
  loadSaved();
  return { scheduleSave, flush };
}
