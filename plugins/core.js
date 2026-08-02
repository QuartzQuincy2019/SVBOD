/**
 * core.js – UI 控制，依赖 window.sanscript
 */
(function() {
    'use strict';

    if (typeof window.sanscript === 'undefined') {
        console.error('sanscript library not loaded. Please check BIndicTl.js path.');
        return;
    }
    const sanscript = window.sanscript;

    // DOM 元素
    const iastInput = document.getElementById('iastInput');
    const devaInput = document.getElementById('devaInput');
    const siddhamInput = document.getElementById('siddhamInput');
    const panelDeva = document.getElementById('panelDeva');
    const toggleBtn = document.getElementById('toggleDevaBtn');
    const specialButtons = document.querySelectorAll('.special-chars button');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');

    if (!iastInput || !devaInput || !siddhamInput || !panelDeva || !toggleBtn || !fontSizeSlider) {
        console.error('Required DOM elements not found.');
        return;
    }

    // ---------- 同步锁（防止循环覆盖） ----------
    let isSyncing = false;

    // ---------- 防抖（支持取消） ----------
    function debounce(fn, delay) {
        let timer;
        const debounced = function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
        debounced.cancel = function() {
            clearTimeout(timer);
        };
        return debounced;
    }

    // ---------- 初始化占位文本 ----------
    function initPlaceholders() {
        const iastPlaceholder = iastInput.placeholder;
        if (iastPlaceholder && iastPlaceholder !== '') {
            const devaText = sanscript.iastToDevanagari(iastPlaceholder);
            const sidText = sanscript.devanagariToSiddham(devaText);
            devaInput.placeholder = devaText;
            siddhamInput.placeholder = sidText;
        } else {
            devaInput.placeholder = '输入天城文…';
            siddhamInput.placeholder = '输入悉昙体…';
        }
    }

    // ---------- 核心更新函数（带同步锁与防抖取消） ----------
    function updateFromIAST() {
        if (isSyncing) return;
        updateFromDevaDeb.cancel();
        updateFromSiddhamDeb.cancel();

        const iastText = iastInput.value;
        const devaText = sanscript.iastToDevanagari(iastText);
        const sidText = sanscript.devanagariToSiddham(devaText);
        isSyncing = true;
        devaInput.value = devaText;
        siddhamInput.value = sidText;
        isSyncing = false;
    }

    function updateFromDeva() {
        if (isSyncing) return;
        updateFromIASTDeb.cancel();
        updateFromSiddhamDeb.cancel();

        const devaText = devaInput.value;
        const iastText = sanscript.devanagariToIast(devaText);
        const sidText = sanscript.devanagariToSiddham(devaText);
        isSyncing = true;
        iastInput.value = iastText;
        siddhamInput.value = sidText;
        isSyncing = false;
    }

    function updateFromSiddham() {
        if (isSyncing) return;
        updateFromIASTDeb.cancel();
        updateFromDevaDeb.cancel();

        const sidText = siddhamInput.value;
        const devaText = sanscript.siddhamToDevanagari(sidText);
        isSyncing = true;
        devaInput.value = devaText;
        iastInput.value = sanscript.devanagariToIast(devaText);
        isSyncing = false;
    }

    const updateFromIASTDeb = debounce(updateFromIAST, 150);
    const updateFromDevaDeb = debounce(updateFromDeva, 150);
    const updateFromSiddhamDeb = debounce(updateFromSiddham, 150);

    // ---------- IAST 便捷输入模式 ----------
    const QUICK_REPLACE_MAP = {
        "'s": 'ś', // 简化按键
        "s/": 'ś',
        "z": 'ś',
        '"s': 'ś',
        "s'": ';ś', // 兼容讹误
        "s'": 'ś', // 兼容讹误
        '`s': 'ś', // 兼容讹误
        "'n": 'ṅ', // 简化按键
        '"n': 'ṅ',
        '~n': 'ñ',
        '`n': 'ñ', // 简化按键
        '~m': 'm̐',
        '//': 'm̐',
        '`m': 'm̐', // 简化按键
        '.s': 'ṣ',
        'w': 'ṭ', // SLP1
        '.t': 'ṭ',
        '.d': 'ḍ',
        'q': 'ḍ', // SLP1
        '.n': 'ṇ',
        '..r': 'ṝ',
        '..l': 'ḹ',
        '.h': 'ḥ',
        '.m': 'ṃ',
        'aa': 'ā',
        'ii': 'ī',
        'uu': 'ū',
        '.r': 'ṛ',
        '.l': 'ḷ'
    };
    // 按长度降序排列，优先匹配长组合
    const QUICK_KEYS = Object.keys(QUICK_REPLACE_MAP).sort((a, b) => b.length - a.length);

    let quickMode = false;
    const quickToggleBtn = document.getElementById('quickInputToggle');

    if (quickToggleBtn) {
        quickToggleBtn.addEventListener('click', function() {
            quickMode = !quickMode;
            this.classList.toggle('active', quickMode);
            this.textContent = quickMode ? '⌨️ IAST便捷输入 (开)' : '⌨️ IAST便捷输入';
            iastInput.classList.toggle('quick-mode-active', quickMode);

            // ---- 开启时立即全局替换现有内容 ----
            if (quickMode) {
                const currentValue = iastInput.value;
                if (currentValue) {
                    let newValue = currentValue;
                    // 按长度降序（QUICK_KEYS 已排序），确保长键优先
                    for (let key of QUICK_KEYS) {
                        // 转义正则特殊字符
                        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(escapedKey, 'gi'); // 忽略大小写
                        newValue = newValue.replace(regex, QUICK_REPLACE_MAP[key]);
                    }
                    if (newValue !== currentValue) {
                        iastInput.value = newValue;
                        // 光标移到末尾
                        iastInput.selectionStart = iastInput.selectionEnd = newValue.length;
                        // 立即同步其他面板（内部有同步锁，不会触发循环）
                        updateFromIAST();
                    }
                }
            }
            iastInput.focus();
        });
    }

    // 自定义 IAST 输入处理（插入快速替换）
    function handleIastInput(e) {
        if (isSyncing) return;

        if (quickMode) {
            const input = e.target;
            const cursor = input.selectionStart;
            const value = input.value;
            let replaced = false;
            let newValue = value;
            let newCursor = cursor;

            // 最大键长为3（如 "..r"）
            const maxLen = 3;
            const start = Math.max(0, cursor - maxLen);
            const sub = value.substring(start, cursor);
            const subLower = sub.toLowerCase();

            for (let key of QUICK_KEYS) {
                const keyLower = key.toLowerCase();
                if (subLower.endsWith(keyLower)) {
                    const replaceStart = start + sub.length - key.length;
                    const prefix = value.substring(0, replaceStart);
                    const suffix = value.substring(cursor);
                    newValue = prefix + QUICK_REPLACE_MAP[key] + suffix;
                    newCursor = prefix.length + QUICK_REPLACE_MAP[key].length;
                    replaced = true;
                    break;
                }
            }

            if (replaced) {
                isSyncing = true;
                input.value = newValue;
                input.selectionStart = input.selectionEnd = newCursor;
                isSyncing = false;
                updateFromIAST();
                return;
            }
        }

        updateFromIASTDeb(e);
    }

    // ---------- 事件绑定 ----------
    iastInput.removeEventListener('input', updateFromIASTDeb);
    iastInput.addEventListener('input', handleIastInput);
    devaInput.addEventListener('input', updateFromDevaDeb);
    siddhamInput.addEventListener('input', updateFromSiddhamDeb);

    toggleBtn.addEventListener('click', function() {
        panelDeva.classList.toggle('visible');
        toggleBtn.textContent = panelDeva.classList.contains('visible') ? '☰ 隐藏天城文' : '☰ 显示天城文';
    });

    // ---------- 特殊字符按钮插入 ----------
    function insertCharAtCursor(input, char) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        if (start === undefined || start === null || (start === 0 && end === 0 && value.length === 0)) {
            input.value = value + char;
            input.selectionStart = input.selectionEnd = value.length + char.length;
        } else {
            const before = value.substring(0, start);
            const after = value.substring(end);
            input.value = before + char + after;
            const newPos = start + char.length;
            input.selectionStart = input.selectionEnd = newPos;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
    }

    specialButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const char = this.getAttribute('data-char');
            if (char) {
                if (document.activeElement !== iastInput) {
                    iastInput.focus();
                }
                insertCharAtCursor(iastInput, char);
            }
        });
    });

    // ---------- 字体大小滑块 ----------
    function setFontSize(size) {
        const panels = document.querySelectorAll('.panel-textarea');
        panels.forEach(el => {
            el.style.fontSize = size + 'px';
        });
        fontSizeDisplay.textContent = size + 'px';
    }

    fontSizeSlider.addEventListener('input', function() {
        const val = parseInt(this.value, 10);
        setFontSize(val);
    });

    setFontSize(parseInt(fontSizeSlider.value, 10));

    // ---------- 执行初始化 ----------
    initPlaceholders();
})();