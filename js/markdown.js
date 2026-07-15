// ==================== MARKDOWN ====================
function renderMarkdown(text) {
  if (!text) return '';
  let h = escapeHtml(text);

  // Code blocks
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
    const id = 'cb-' + Math.random().toString(36).slice(2, 10);
    return '<pre><button class="code-copy-btn" onclick="copyCode(\'' + id + '\')" title="复制">📋 复制</button><code id="' + id + '">' + code + '</code></pre>';
  });

  // Inline code
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquote
  h = h.replace(/^\u003e (.+)$/gm, '<blockquote>$1</blockquote>');

  // Lists
  h = h.replace(/^(\s*)-\s+(.+)$/gm, function(m, indent, content) {
    return '<li>' + content + '</li>';
  });

  // XSS protection
  h = h.replace(/&lt;\s*script[^&]*&gt;[\s\S]*?&lt;\/script&gt;/gi, '[BLOCKED]');
  h = h.replace(/&lt;\s*iframe[^&]*&gt;[\s\S]*?&lt;\/iframe&gt;/gi, '[BLOCKED]');
  h = h.replace(/javascript:/gi, '[BLOCKED]:');
  h = h.replace(/on\w+\s*=/gi, 'data-blocked=');

  // Line breaks
  h = h.replace(/\n/g, '<br>');

  return h;
}

function copyCode(id) {
  const code = document.getElementById(id);
  if (!code) return;
  const text = code.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('button[onclick*="' + id + '"]');
    if (btn) {
      btn.textContent = '✓ 已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 复制';
        btn.classList.remove('copied');
      }, 2000);
    }
    showToast('代码已复制', 'success');
  });
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
