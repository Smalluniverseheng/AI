/* ==================== VOICE · 语音输入（识别）与朗读（TTS） ==================== */
const Voice = (() => {

  /* ---------- 语音识别（语音输入） ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;
  let recognizing = false;

  function inputSupported() { return !!SR; }

  function startInput(onResult, onEnd) {
    if (!SR) { Toast.warning('当前浏览器不支持语音输入，建议使用 Chrome / Edge'); return false; }
    stopInput();
    recog = new SR();
    recog.lang = 'zh-CN';
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = e => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      onResult(final, interim);
    };
    recog.onerror = e => {
      if (e.error === 'not-allowed') Toast.error('麦克风权限被拒绝，请在浏览器设置中允许');
      else if (e.error !== 'aborted') Toast.warning('语音识别中断：' + e.error);
      recognizing = false;
      onEnd && onEnd();
    };
    recog.onend = () => { recognizing = false; onEnd && onEnd(); };
    try { recog.start(); recognizing = true; return true; }
    catch (e) { recognizing = false; return false; }
  }

  function stopInput() {
    if (recog) { try { recog.stop(); } catch (e) {} recog = null; }
    recognizing = false;
  }

  function isRecognizing() { return recognizing; }

  /* ---------- 语音朗读（TTS） ---------- */
  let currentUtter = null;
  let speakingMsgId = null;

  function ttsSupported() { return 'speechSynthesis' in window; }

  function getVoices() {
    if (!ttsSupported()) return [];
    return speechSynthesis.getVoices().filter(v => /zh|中文|Chinese|Mandarin/i.test(v.lang + v.name));
  }

  function pickVoice() {
    const vs = Store.state.voiceSettings;
    const all = speechSynthesis.getVoices();
    if (vs.voiceURI) {
      const found = all.find(v => v.voiceURI === vs.voiceURI);
      if (found) return found;
    }
    const zh = getVoices();
    return zh.find(v => /Xiaoxiao|Yaoyao|婷婷|小冰/i.test(v.name)) || zh[0] || all[0] || null;
  }

  function speak(text, msgId) {
    if (!ttsSupported()) { Toast.warning('当前浏览器不支持语音朗读'); return false; }
    stopSpeak();
    // 清理 markdown 符号，读纯文本
    const clean = String(text)
      .replace(/```[\s\S]*?```/g, '，代码段，')
      .replace(/[#*>`\-|[\](),.:;!?！？，。；：]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 1200);
    if (!clean.trim()) return false;
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'zh-CN';
    u.rate = Store.state.voiceSettings.rate || 1;
    currentUtter = u;
    speakingMsgId = msgId || null;
    u.onend = () => { currentUtter = null; speakingMsgId = null; if (window.UI) UI.updateSpeakButtons(); };
    u.onerror = () => { currentUtter = null; speakingMsgId = null; if (window.UI) UI.updateSpeakButtons(); };
    speechSynthesis.speak(u);
    if (window.UI) UI.updateSpeakButtons();
    return true;
  }

  function stopSpeak() {
    if (ttsSupported()) speechSynthesis.cancel();
    currentUtter = null;
    speakingMsgId = null;
    if (window.UI) UI.updateSpeakButtons();
  }

  function isSpeaking(msgId) {
    if (!currentUtter) return false;
    return msgId ? speakingMsgId === msgId : true;
  }

  // 预热语音列表（部分浏览器需要）
  if (ttsSupported()) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {};
  }

  return { inputSupported, startInput, stopInput, isRecognizing, ttsSupported, speak, stopSpeak, isSpeaking, getVoices };
})();
