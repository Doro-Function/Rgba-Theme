const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const THEME_FILES = {
  'Rgba Theme': 'Rgba Theme-color-theme.json',
  'Rgba Theme - Dracula': 'Rgba Theme-Dracula-color-theme.json',
  'Rgba Theme - Monokai': 'Rgba Theme-Monokai-color-theme.json',
  'Rgba Theme - GitHub Dark': 'Rgba Theme-GitHub Dark-color-theme.json',
  'Rgba Theme - Xcode Dark': 'Rgba Theme-Xcode Dark-color-theme.json',
  'Rgba Theme - Xcode Light': 'Rgba Theme-Xcode Light-color-theme.json',
  'Rgba Theme - Eye Care': 'Rgba Theme-Eye Care-color-theme.json',
};

function getThemePath() {
  const active = vscode.workspace.getConfiguration('workbench').get('colorTheme');
  const file = THEME_FILES[active] || 'Rgba Theme-color-theme.json';
  return path.join(__dirname, 'themes', file);
}

const COLOR_GROUPS = {
  "Editor 编辑器": {
    "editor.background": "Background 背景色",
    "editor.foreground": "Foreground 前景色",
    "editor.selectionBackground": "Selection Background 选中背景",
    "editor.lineHighlightBackground": "Line Highlight 当前行高亮",
    "editorCursor.foreground": "Cursor 光标颜色",
    "editorLineNumber.foreground": "Line Number 行号颜色",
    "editorLineNumber.activeForeground": "Active Line Number 当前行号颜色",
    "editorGutter.background": "Gutter Background Gutter背景",
    "editor.findMatchBackground": "Find Match 搜索匹配背景",
    "editor.findMatchHighlightBackground": "Find Highlight 搜索高亮背景",
    "editor.wordHighlightBackground": "Word Highlight 词高亮背景",
  },
  "Tabs 标签页": {
    "tab.activeBackground": "Active Tab Background 活动标签背景",
    "tab.activeForeground": "Active Tab Foreground 活动标签前景",
    "tab.inactiveBackground": "Inactive Tab Background 非活动标签背景",
    "tab.inactiveForeground": "Inactive Tab Foreground 非活动标签前景",
    "tab.border": "Tab Border 标签边框",
  },
  "Sidebar 侧边栏": {
    "sideBar.background": "Sidebar Background 侧边栏背景",
    "sideBar.foreground": "Sidebar Foreground 侧边栏前景",
    "sideBar.border": "Sidebar Border 侧边栏边框",
    "sideBarTitle.foreground": "Sidebar Title 侧边栏标题",
  },
  "Activity Bar 活动栏": {
    "activityBar.background": "Activity Bar Background 活动栏背景",
    "activityBar.foreground": "Activity Bar Foreground 活动栏前景",
    "activityBar.border": "Activity Bar Border 活动栏边框",
    "activityBarBadge.background": "Activity Bar Badge 活动栏徽章",
  },
  "UI 界面": {
    "statusBar.background": "Status Bar Background 状态栏背景",
    "statusBar.foreground": "Status Bar Foreground 状态栏前景",
    "titleBar.activeBackground": "Title Bar Background 标题栏背景",
    "panel.background": "Panel Background 面板背景",
    "panel.border": "Panel Border 面板边框",
    "terminal.background": "Terminal Background 终端背景",
    "terminal.foreground": "Terminal Foreground 终端前景",
  },
  "Input / Button 输入/按钮": {
    "input.background": "Input Background 输入框背景",
    "input.foreground": "Input Foreground 输入框前景",
    "input.border": "Input Border 输入框边框",
    "button.background": "Button Background 按钮背景",
    "button.foreground": "Button Foreground 按钮前景",
  },
  "Syntax 语法高亮": {
    "comment": "Comment 注释",
    "keyword": "Keyword 关键字",
    "string": "String 字符串",
    "number": "Number 数字",
    "function": "Function 函数名",
    "variable": "Variable 变量",
    "type": "Type / Class 类型/类",
    "operator": "Operator 运算符",
    "tag": "Tag 标签",
    "attribute": "Attribute 属性",
  }
};

const TOKEN_SCOPE_MAP = {
  "comment":   "comment",
  "keyword":   "keyword",
  "string":    "string",
  "number":    "constant.numeric",
  "function":  "entity.name.function",
  "variable":  "variable",
  "type":      "entity.name",
  "operator":  "keyword.control",
  "tag":       "entity.name.tag",
  "attribute": "entity.other.attribute-name",
};

function rgbaToHex(r, g, b, a = 1) {
  const toHex = n => Math.round(n).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 1) return hex + toHex(Math.round(a * 255));
  return hex;
}

function parseRgba(input) {
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) return rgbaToHex(+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1);
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(input)) return input;
  return null;
}

function getTheme() {
  return JSON.parse(fs.readFileSync(getThemePath(), 'utf8'));
}

function saveTheme(theme) {
  fs.writeFileSync(getThemePath(), JSON.stringify(theme, null, '\t'), 'utf8');
}

function getTokenColor(tokenColors, scope) {
  for (const t of tokenColors) {
    const scopes = Array.isArray(t.scope) ? t.scope : [t.scope];
    if (scopes.includes(scope)) return t.settings && t.settings.foreground;
  }
  return null;
}

function buildColorMap(theme) {
  const map = Object.assign({}, theme.colors);
  for (const [key, scope] of Object.entries(TOKEN_SCOPE_MAP)) {
    map[key] = getTokenColor(theme.tokenColors, scope) || '#ffffff';
  }
  return map;
}

function applyColorMap(theme, colors) {
  for (const [key, val] of Object.entries(colors)) {
    const hex = parseRgba(val);
    if (!hex) continue;
    if (TOKEN_SCOPE_MAP[key]) {
      const scope = TOKEN_SCOPE_MAP[key];
      const entry = theme.tokenColors.find(t => {
        const s = Array.isArray(t.scope) ? t.scope : [t.scope];
        return s.includes(scope);
      });
      if (entry) entry.settings.foreground = hex;
    } else {
      theme.colors[key] = hex;
    }
  }
}

// WCAG contrast ratio
function getLuminance(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const toLinear = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1.slice(0,7));
  const l2 = getLuminance(hex2.slice(0,7));
  const lighter = Math.max(l1,l2), darker = Math.min(l1,l2);
  return ((lighter+0.05)/(darker+0.05)).toFixed(2);
}

function getWebviewContent(colorMap, fontConfig) {
  const allKeys = [];
  const sections = Object.entries(COLOR_GROUPS).map(([groupName, items]) => {
    const rows = Object.entries(items).map(([key, label]) => {
      allKeys.push(key);
      const raw = colorMap[key] || '#000000';
      const hex = raw.slice(0, 7);
      let alpha = 100;
      const aaMatch = raw.match(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})$/);
      if (aaMatch) alpha = Math.round(parseInt(aaMatch[1], 16) / 255 * 100);
      const rgbaMatch = raw.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)/);
      if (rgbaMatch) alpha = Math.round(+rgbaMatch[1] * 100);

      // contrast badge for foreground keys
      let contrastBadge = '';
      const fgKeys = ['editor.foreground','editor.selectionBackground','editorCursor.foreground'];
      if (fgKeys.includes(key) && colorMap['editor.background']) {
        const ratio = getContrastRatio(hex, colorMap['editor.background'].slice(0,7));
        const pass = ratio >= 4.5 ? '✓' : '✗';
        contrastBadge = `<span class="contrast ${ratio>=4.5?'pass':'fail'}" title="Contrast ratio 对比度 ${ratio}:1">${pass} ${ratio}</span>`;
      }

      return `<tr>
        <td>${label}${contrastBadge}</td>
        <td><code>${key}</code></td>
        <td>
          <input type="color" id="picker_${key}" value="${hex}">
          <input type="range" id="alpha_${key}" min="0" max="100" value="${alpha}" style="width:70px;vertical-align:middle">
          <span id="alphaval_${key}" style="font-size:11px">${alpha}%</span>
        </td>
        <td>
          <input type="text" id="input_${key}" value="${raw}" placeholder="rgba(r,g,b,a) or #rrggbb">
          <button class="fav-btn" onclick="saveFav('${key}')" title="Save to Favorites 收藏此颜色">★</button>
        </td>
      </tr>`;
    }).join('');
    return `<h3>${groupName}</h3>
    <table>
      <thead><tr><th>Name 名称</th><th>Token</th><th>Color / Opacity 取色/透明度</th><th>Value 值</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }).join('');

  const themeOptions = Object.keys(THEME_FILES).map(t =>
    `<option value="${t}"${t === (vscode.workspace.getConfiguration('workbench').get('colorTheme')) ? ' selected' : ''}>${t}</option>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  h3 { margin: 20px 0 6px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); }
  input[type=text] { width: 180px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px; }
  input[type=color] { width: 40px; height: 26px; border: none; cursor: pointer; background: none; }
  input[type=number] { width: 60px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px; }
  select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px 8px; }
  .btns { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  button { padding: 7px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .fav-btn { padding: 2px 6px; font-size: 13px; background: transparent; color: var(--vscode-foreground); border: 1px solid var(--vscode-input-border); cursor: pointer; }
  #status { margin-top: 10px; color: var(--vscode-notificationsInfoIcon-foreground); }
  .contrast { font-size: 10px; margin-left: 4px; padding: 1px 4px; border-radius: 3px; }
  .contrast.pass { background: #2d6a2d; color: #fff; }
  .contrast.fail { background: #6a2d2d; color: #fff; }
  .font-section { margin: 16px 0; padding: 12px; border: 1px solid var(--vscode-panel-border); }
  .font-section label { margin-right: 8px; }
  .fav-section { margin: 12px 0; padding: 10px; border: 1px solid var(--vscode-panel-border); }
  .fav-item { display: inline-flex; align-items: center; gap: 4px; margin: 3px; padding: 3px 8px; border: 1px solid var(--vscode-input-border); cursor: pointer; font-size: 12px; }
  .fav-swatch { width: 14px; height: 14px; display: inline-block; border: 1px solid #888; }
  .theme-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
</style>
</head>
<body>
<h2>Rgba Theme Color Customizer <span style="font-size:14px;opacity:0.6">颜色自定义</span></h2>

<div class="theme-row">
  <label>Switch Theme 切换主题：</label>
  <select id="themeSelect" onchange="switchTheme()">${themeOptions}</select>
</div>

<div class="font-section">
  <strong>Font Settings 字体设置</strong><br><br>
  <label>Font 字体：<input type="text" id="fontFamily" value="${fontConfig.fontFamily}" style="width:220px" placeholder="Consolas, 'Courier New'"></label>
  <label>Size 字号：<input type="number" id="fontSize" value="${fontConfig.fontSize}" min="8" max="32"></label>
  <label>Line Height 行高：<input type="number" id="lineHeight" value="${fontConfig.lineHeight}" min="0" max="100" step="1"></label>
  <button onclick="applyFont()" style="margin-left:8px">Apply Font 应用字体</button>
</div>

<div class="fav-section">
  <strong>Favorites 收藏颜色</strong> <span style="font-size:11px;opacity:0.7">(Click to copy 点击复制颜色值)</span>
  <div id="favList"></div>
</div>

${sections}
<div class="btns">
  <button onclick="applyColors()">Apply Colors 应用颜色</button>
  <button onclick="resetColors()">Reset Default 恢复默认</button>
  <button onclick="exportConfig()">Export 导出配置</button>
  <label style="padding:0"><button onclick="document.getElementById('importFile').click()">Import 导入配置</button><input type="file" id="importFile" accept=".json" style="display:none" onchange="importConfig(event)"></label>
</div>
<div id="status"></div>
<script>
  const vscode = acquireVsCodeApi();
  const keys = ${JSON.stringify(allKeys)};
  const THEME_FILES_KEYS = ${JSON.stringify(Object.keys(THEME_FILES))};

  // ── 收藏夹 ──
  let favs = JSON.parse(localStorage.getItem('rgba-favs') || '[]');

  function renderFavs() {
    const el = document.getElementById('favList');
    if (!favs.length) { el.innerHTML = '<span style="opacity:0.5;font-size:12px">No favorites yet 暂无收藏</span>'; return; }
    el.innerHTML = favs.map((f,i) => \`<span class="fav-item" onclick="copyFav('\${f.color}')" title="\${f.key}: \${f.color}">
      <span class="fav-swatch" style="background:\${f.color.slice(0,7)}"></span>\${f.color}
      <span onclick="event.stopPropagation();removeFav(\${i})" style="opacity:0.5;margin-left:2px">✕</span>
    </span>\`).join('');
  }

  function saveFav(key) {
    const color = document.getElementById('input_' + key).value.trim();
    if (!color) return;
    favs.unshift({ key, color });
    if (favs.length > 20) favs.pop();
    localStorage.setItem('rgba-favs', JSON.stringify(favs));
    renderFavs();
  }

  function copyFav(color) {
    navigator.clipboard.writeText(color).catch(()=>{});
    document.getElementById('status').textContent = 'Copied 已复制：' + color;
  }

  function removeFav(i) {
    favs.splice(i, 1);
    localStorage.setItem('rgba-favs', JSON.stringify(favs));
    renderFavs();
  }

  renderFavs();

  // ── 颜色同步 ──
  function hexToRgb(hex) {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  }

  function syncInput(key) {
    const hex = document.getElementById('picker_' + key).value;
    const alpha = document.getElementById('alpha_' + key).value / 100;
    const [r,g,b] = hexToRgb(hex);
    document.getElementById('alphaval_' + key).textContent = Math.round(alpha*100) + '%';
    document.getElementById('input_' + key).value = alpha < 1 ? 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')' : hex;
  }

  keys.forEach(key => {
    document.getElementById('picker_' + key).addEventListener('input', () => syncInput(key));
    document.getElementById('alpha_' + key).addEventListener('input', () => syncInput(key));
    document.getElementById('input_' + key).addEventListener('change', () => {
      const v = document.getElementById('input_' + key).value.trim();
      if (/^#[0-9a-fA-F]{6}/.test(v)) {
        document.getElementById('picker_' + key).value = v.slice(0,7);
        document.getElementById('alpha_' + key).value = 100;
        document.getElementById('alphaval_' + key).textContent = '100%';
      }
      const m = v.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)/);
      if (m) {
        const toHex = n => (+n).toString(16).padStart(2,'0');
        document.getElementById('picker_' + key).value = '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
        const a = m[4] !== undefined ? Math.round(+m[4]*100) : 100;
        document.getElementById('alpha_' + key).value = a;
        document.getElementById('alphaval_' + key).textContent = a + '%';
      }
    });
  });

  // ── 主题切换 ──
  function switchTheme() {
    const t = document.getElementById('themeSelect').value;
    vscode.postMessage({ command: 'switchTheme', theme: t });
  }

  // ── 字体 ──
  function applyFont() {
    vscode.postMessage({ command: 'font', fontFamily: document.getElementById('fontFamily').value.trim(), fontSize: +document.getElementById('fontSize').value, lineHeight: +document.getElementById('lineHeight').value });
  }

  // ── 颜色应用/重置 ──
  function applyColors() {
    const colors = {};
    keys.forEach(k => { colors[k] = document.getElementById('input_' + k).value.trim(); });
    vscode.postMessage({ command: 'apply', colors });
  }

  function resetColors() { vscode.postMessage({ command: 'reset' }); }

  // ── 导出/导入 ──
  function exportConfig() {
    const colors = {};
    keys.forEach(k => { colors[k] = document.getElementById('input_' + k).value.trim(); });
    const data = { colors, font: { fontFamily: document.getElementById('fontFamily').value, fontSize: +document.getElementById('fontSize').value, lineHeight: +document.getElementById('lineHeight').value } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rgba-theme-config.json'; a.click();
  }

  function importConfig(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.colors) Object.entries(data.colors).forEach(([k,v]) => {
          const inp = document.getElementById('input_' + k);
          const pic = document.getElementById('picker_' + k);
          if (inp) { inp.value = v; if (/^#/.test(v)) pic.value = v.slice(0,7); }
        });
        if (data.font) {
          if (data.font.fontFamily) document.getElementById('fontFamily').value = data.font.fontFamily;
          if (data.font.fontSize) document.getElementById('fontSize').value = data.font.fontSize;
          if (data.font.lineHeight) document.getElementById('lineHeight').value = data.font.lineHeight;
        }
        document.getElementById('status').textContent = 'Imported successfully. Click "Apply Colors" to apply. 导入成功，点击"应用颜色"生效。';
      } catch { document.getElementById('status').textContent = 'Import failed: invalid JSON. 导入失败：JSON 格式错误。'; }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── 消息接收 ──
  window.addEventListener('message', e => {
    if (e.data.command === 'status') document.getElementById('status').textContent = e.data.text;
    if (e.data.command === 'updateValues') {
      Object.entries(e.data.colors).forEach(([key, val]) => {
        const input = document.getElementById('input_' + key);
        const picker = document.getElementById('picker_' + key);
        if (input) { input.value = val; picker.value = val.slice(0,7); }
      });
      if (e.data.theme) document.getElementById('themeSelect').value = e.data.theme;
    }
  });
</script>
</body>
</html>`;
}

function activate(context) {
  let currentPanel = null;

  context.subscriptions.push(
    vscode.commands.registerCommand('rgba-theme.customize', () => {
      if (currentPanel) { currentPanel.reveal(); return; }

      const panel = vscode.window.createWebviewPanel(
        'rgbaThemeCustomizer', 'Rgba Theme Customizer',
        vscode.ViewColumn.One, { enableScripts: true }
      );
      currentPanel = panel;
      panel.onDidDispose(() => { currentPanel = null; }, null, context.subscriptions);

      const themePath = getThemePath();
      const backupPath = themePath.replace('.json', '.default.json');
      if (!fs.existsSync(backupPath)) fs.copyFileSync(themePath, backupPath);

      const editorCfg = vscode.workspace.getConfiguration('editor');
      const fontConfig = {
        fontFamily: editorCfg.get('fontFamily') || 'Consolas',
        fontSize: editorCfg.get('fontSize') || 14,
        lineHeight: editorCfg.get('lineHeight') || 0,
      };

      panel.webview.html = getWebviewContent(buildColorMap(getTheme()), fontConfig);

      const themeWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('workbench.colorTheme')) {
          const tp = getThemePath();
          const bp = tp.replace('.json', '.default.json');
          if (!fs.existsSync(bp)) fs.copyFileSync(tp, bp);
          const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
          panel.webview.postMessage({ command: 'updateValues', colors: buildColorMap(getTheme()), theme: currentTheme });
          panel.webview.postMessage({ command: 'status', text: 'Theme switched, data synced. 主题已切换，数据已同步。' });
        }
      });
      context.subscriptions.push(themeWatcher);

      panel.webview.onDidReceiveMessage(async msg => {
        if (msg.command === 'apply') {
          const theme = getTheme();
          applyColorMap(theme, msg.colors);
          saveTheme(theme);
          // 实时预览：写入 colorCustomizations
          const colorCustom = {};
          Object.entries(msg.colors).forEach(([k, v]) => {
            if (!TOKEN_SCOPE_MAP[k] && parseRgba(v)) colorCustom[k] = parseRgba(v);
          });
          await vscode.workspace.getConfiguration('workbench').update('colorCustomizations', colorCustom, vscode.ConfigurationTarget.Global);
          panel.webview.postMessage({ command: 'status', text: 'Applied! 已应用！（Live preview active, no reload needed 实时预览已生效，无需重载）' });
        } else if (msg.command === 'reset') {
          const tp = getThemePath();
          const bp = tp.replace('.json', '.default.json');
          if (fs.existsSync(bp)) fs.copyFileSync(bp, tp);
          await vscode.workspace.getConfiguration('workbench').update('colorCustomizations', {}, vscode.ConfigurationTarget.Global);
          panel.webview.postMessage({ command: 'updateValues', colors: buildColorMap(getTheme()) });
          panel.webview.postMessage({ command: 'status', text: 'Reset to default. 已恢复默认。' });
        } else if (msg.command === 'font') {
          const cfg = vscode.workspace.getConfiguration('editor');
          if (msg.fontFamily) await cfg.update('fontFamily', msg.fontFamily, vscode.ConfigurationTarget.Global);
          if (msg.fontSize) await cfg.update('fontSize', msg.fontSize, vscode.ConfigurationTarget.Global);
          await cfg.update('lineHeight', msg.lineHeight, vscode.ConfigurationTarget.Global);
          panel.webview.postMessage({ command: 'status', text: 'Font applied. 字体已应用。' });
        } else if (msg.command === 'switchTheme') {
          await vscode.workspace.getConfiguration('workbench').update('colorTheme', msg.theme, vscode.ConfigurationTarget.Global);
        }
      }, undefined, context.subscriptions);
    }),

    vscode.commands.registerCommand('rgba-theme.reset', async () => {
      const tp = getThemePath();
      const bp = tp.replace('.json', '.default.json');
      if (fs.existsSync(bp)) fs.copyFileSync(bp, tp);
      await vscode.workspace.getConfiguration('workbench').update('colorCustomizations', {}, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Rgba Theme reset to default. 已恢复默认。');
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
