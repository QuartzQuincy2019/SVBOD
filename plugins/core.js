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

    // ---------- 初始化占位文本 ----------
    function initPlaceholders() {
        const iastPlaceholder = iastInput.placeholder;
        if (iastPlaceholder && iastPlaceholder !== '') {
            const devaText = sanscript.iastToDevanagari(iastPlaceholder);
            const sidText = sanscript.devanagariToSiddham(devaText);
            devaInput.placeholder = devaText;
            siddhamInput.placeholder = sidText;
        } else {
            // 若 IAST 无占位，则使用默认提示
            devaInput.placeholder = '输入天城文…';
            siddhamInput.placeholder = '输入悉昙体…';
        }
    }

    // ---------- 防抖 ----------
    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ---------- 更新函数 ----------
    function updateFromIAST() {
        const iastText = iastInput.value;
        const devaText = sanscript.iastToDevanagari(iastText);
        devaInput.value = devaText;
        siddhamInput.value = sanscript.devanagariToSiddham(devaText);
    }

    function updateFromDeva() {
        const devaText = devaInput.value;
        iastInput.value = sanscript.devanagariToIast(devaText);
        siddhamInput.value = sanscript.devanagariToSiddham(devaText);
    }

    function updateFromSiddham() {
        const sidText = siddhamInput.value;
        const devaText = sanscript.siddhamToDevanagari(sidText);
        devaInput.value = devaText;
        iastInput.value = sanscript.devanagariToIast(devaText);
    }

    const updateFromIASTDeb = debounce(updateFromIAST, 150);
    const updateFromDevaDeb = debounce(updateFromDeva, 150);
    const updateFromSiddhamDeb = debounce(updateFromSiddham, 150);

    // ---------- 事件绑定 ----------
    iastInput.addEventListener('input', updateFromIASTDeb);
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

    // 初始化字体大小
    setFontSize(parseInt(fontSizeSlider.value, 10));

    // ---------- 执行初始化 ----------
    initPlaceholders();

    // 注意：没有默认填充值，文本框为空，仅显示占位提示
})();