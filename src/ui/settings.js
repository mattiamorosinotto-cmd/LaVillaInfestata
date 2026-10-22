// Menu di pausa: volume, luminosità, effetti di movimento, voce; ritorno alla stanza o uscita.
import { $ } from './dom.js';

/** Corpo HTML del menu. auto = pausa automatica dopo un cambio di scheda. */
export function settingsHtml(prefs, t, { auto, inGame }) {
  return (
    '<p>' +
    (auto ? t.introAuto : t.intro) +
    '</p><div class="settings-grid"><div><label for="volume">' +
    t.volume +
    '</label><input id="volume" type="range" min="0" max="100" value="' +
    Math.round(prefs.volume * 100) +
    '"><div class="setting-help">' +
    t.volumeHelp +
    '</div></div><div><label for="brightness">' +
    t.brightness +
    '</label><input id="brightness" type="range" min="70" max="170" value="' +
    Math.round(prefs.brightness * 100) +
    '"><div class="setting-help">' +
    t.brightnessHelp +
    '</div></div><label><input id="motionSetting" type="checkbox" ' +
    (prefs.motion ? 'checked' : '') +
    '> ' +
    t.motion +
    '</label><label><input id="voiceSetting" type="checkbox" ' +
    (prefs.voice ? 'checked' : '') +
    '> ' +
    t.voice +
    ' <span class="setting-help">' +
    t.voiceHelp +
    '</span></label></div><div class="row"><button id="back" class="primary">' +
    (inGame ? t.backRoom : t.backLanding) +
    '</button>' +
    (inGame ? '<button id="home" class="quiet">' + t.exit + '</button>' : '') +
    '</div>'
  );
}

/** Apre il menu e collega i controlli. onBack e onExit decidono cosa succede al gioco. */
export function openSettings(ctx, { auto, inGame, onBack, onExit }) {
  const { prefs } = ctx,
    t = ctx.content.ui.settings;
  ctx.modal.open(auto ? t.titleAuto : t.title, settingsHtml(prefs, t, { auto, inGame }), true);
  $('#volume').oninput = (e) => {
    prefs.volume = +e.target.value / 100;
    ctx.audio.setVolume(prefs.volume);
    ctx.save();
  };
  $('#brightness').oninput = (e) => {
    prefs.brightness = +e.target.value / 100;
    ctx.room.applyPrefs();
  };
  $('#motionSetting').onchange = (e) => {
    prefs.motion = e.target.checked;
    prefs.motionUser = true;
    ctx.room.applyPrefs();
  };
  $('#voiceSetting').onchange = (e) => {
    prefs.voice = e.target.checked;
    ctx.save();
  };
  $('#back').onclick = onBack;
  if ($('#home')) $('#home').onclick = onExit;
}
