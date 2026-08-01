/**
 * BIndicTl.js – 转写核心 (IAST ↔ Devanagari ↔ Siddham)
 * 暴露全局对象 window.sanscript
 */
(function() {
    'use strict';

    // ---------- 映射表 ----------
    const IAST_TO_DEVANAGARI_INDEP = {
        'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
        'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'ḹ': 'ॡ',
        'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ'
    };
    const IAST_TO_DEVANAGARI_VOWEL_SIGN = {
        'ā': 'ा', 'i': 'ि', 'ī': 'ी', 'u': 'ु', 'ū': 'ू',
        'ṛ': 'ृ', 'ṝ': 'ॄ', 'ḷ': 'ॢ', 'ḹ': 'ॣ',
        'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ'
    };
    const IAST_TO_DEVANAGARI_CONSONANT = {
        'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
        'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
        'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
        't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
        'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
        'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
        'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह'
    };
    const IAST_TO_DEVANAGARI_SIGN = {
        'ṃ': 'ं',
        'ḥ': 'ः',
        '~': 'ँ'
    };
    const IAST_TO_DEVANAGARI_PUNCT = {
        '|': '।',
        '||': '॥'
    };

    // Devanagari -> Siddham
    const DEVANAGARI_TO_SIDDHAM = {
        'अ': '𑖀', 'आ': '𑖁', 'इ': '𑖂', 'ई': '𑖃',
        'उ': '𑖄', 'ऊ': '𑖅', 'ऋ': '𑖆', 'ॠ': '𑖇',
        'ऌ': '𑖈', 'ॡ': '𑖉', 'ए': '𑖊', 'ऐ': '𑖋',
        'ओ': '𑖌', 'औ': '𑖍', 'ं': '𑖽', 'ः': '𑖾',
        '्': '𑖿', 'ा': '𑖯', 'ि': '𑖰', 'ी': '𑖱',
        'ु': '𑖲', 'ू': '𑖳', 'ृ': '𑖴', 'ॄ': '𑖵',
        'े': '𑖸', 'ै': '𑖹', 'ो': '𑖺', 'ौ': '𑖻',
        'क': '𑖎', 'ख': '𑖏', 'ग': '𑖐', 'घ': '𑖑', 'ङ': '𑖒',
        'च': '𑖓', 'छ': '𑖔', 'ज': '𑖕', 'झ': '𑖖', 'ञ': '𑖗',
        'ट': '𑖘', 'ठ': '𑖙', 'ड': '𑖚', 'ढ': '𑖛', 'ण': '𑖜',
        'त': '𑖝', 'थ': '𑖞', 'द': '𑖟', 'ध': '𑖠', 'न': '𑖡',
        'प': '𑖢', 'फ': '𑖣', 'ब': '𑖤', 'भ': '𑖥', 'म': '𑖦',
        'य': '𑖧', 'र': '𑖨', 'ल': '𑖩', 'व': '𑖪',
        'श': '𑖫', 'ष': '𑖬', 'स': '𑖭', 'ह': '𑖮',
        '।': '𑗂', '॥': '𑗃', 'ँ': '𑖼'
    };
    const SIDDHAM_TO_DEVANAGARI = {};
    for (let [deva, sid] of Object.entries(DEVANAGARI_TO_SIDDHAM)) {
        SIDDHAM_TO_DEVANAGARI[sid] = deva;
    }

    // ---------- 辅助函数 ----------
    function tokenizeIAST(text) {
        const multi = ['kh','gh','ch','jh','ṭh','ḍh','th','dh','ph','bh','ai','au','||'];
        multi.sort((a,b) => b.length - a.length);
        const tokens = [];
        let i = 0;
        while (i < text.length) {
            let matched = false;
            for (let m of multi) {
                if (text.substr(i, m.length) === m) {
                    tokens.push(m);
                    i += m.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push(text[i]);
                i++;
            }
        }
        return tokens;
    }

    function isVowel(tok) { return tok in IAST_TO_DEVANAGARI_INDEP; }
    function isConsonant(tok) { return tok in IAST_TO_DEVANAGARI_CONSONANT; }
    function isSign(tok) { return tok in IAST_TO_DEVANAGARI_SIGN; }
    function isPunct(tok) { return tok in IAST_TO_DEVANAGARI_PUNCT; }

    // ---------- 核心转换 IAST -> Devanagari ----------
    function iastToDevanagari(iastText) {
        if (!iastText) return '';
        const tokens = tokenizeIAST(iastText);
        let result = '';
        let lastWasConsonant = false;

        for (let idx = 0; idx < tokens.length; idx++) {
            const tok = tokens[idx];
            if (isPunct(tok)) {
                result += IAST_TO_DEVANAGARI_PUNCT[tok];
                lastWasConsonant = false;
                continue;
            }
            if (isSign(tok)) {
                result += IAST_TO_DEVANAGARI_SIGN[tok];
                lastWasConsonant = false;
                continue;
            }
            if (isConsonant(tok)) {
                const base = IAST_TO_DEVANAGARI_CONSONANT[tok];
                const next = (idx + 1 < tokens.length) ? tokens[idx + 1] : null;
                if (next !== null && isVowel(next)) {
                    if (next === 'a') {
                        result += base;
                        idx++; // skip 'a'
                        lastWasConsonant = false;
                        continue;
                    } else {
                        const sign = IAST_TO_DEVANAGARI_VOWEL_SIGN[next];
                        if (sign) {
                            result += base + sign;
                            idx++;
                            lastWasConsonant = false;
                            continue;
                        } else {
                            result += base;
                            lastWasConsonant = true;
                            continue;
                        }
                    }
                } else if (next !== null && isSign(next)) {
                    result += base + IAST_TO_DEVANAGARI_SIGN[next];
                    idx++;
                    lastWasConsonant = false;
                    continue;
                } else {
                    result += base + '्';
                    lastWasConsonant = true;
                    continue;
                }
            }
            if (isVowel(tok)) {
                result += IAST_TO_DEVANAGARI_INDEP[tok];
                lastWasConsonant = false;
                continue;
            }
            // 未知字符保留
            result += tok;
            lastWasConsonant = false;
        }
        return result;
    }

    // ---------- Devanagari -> IAST (增强反向转换) ----------
    function devanagariToIast(devaText) {
        if (!devaText) return '';

        const indepVowels = {
            'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī',
            'उ': 'u', 'ऊ': 'ū',
            'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ',
            'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au'
        };
        const consonants = {
            'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
            'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
            'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
            'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
            'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
            'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
            'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h'
        };
        const vowelSigns = {
            'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
            'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'ॣ': 'ḹ',
            'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au'
        };
        const signs = {
            'ं': 'ṃ', 'ः': 'ḥ', 'ँ': '~'
        };
        const punct = {
            '।': '|', '॥': '||'
        };

        let result = '';
        let i = 0;
        const len = devaText.length;

        while (i < len) {
            const ch = devaText[i];

            if (ch in punct) {
                result += punct[ch];
                i++;
                continue;
            }

            if (ch in indepVowels) {
                result += indepVowels[ch];
                i++;
                continue;
            }

            if (ch in signs) {
                result += signs[ch];
                i++;
                continue;
            }

            if (ch in consonants) {
                const next = (i + 1 < len) ? devaText[i+1] : null;
                if (next === '्') {
                    result += consonants[ch];
                    i += 2;
                    continue;
                } else if (next && (next in vowelSigns)) {
                    result += consonants[ch] + vowelSigns[next];
                    i += 2;
                    continue;
                } else {
                    result += consonants[ch] + 'a';
                    i++;
                    continue;
                }
            }

            // 其他字符原样保留
            result += ch;
            i++;
        }

        return result;
    }

    // ---------- Devanagari <-> Siddham ----------
    function devanagariToSiddham(devaText) {
        let result = '';
        for (let ch of devaText) {
            result += DEVANAGARI_TO_SIDDHAM[ch] || ch;
        }
        return result;
    }

    function siddhamToDevanagari(sidText) {
        let result = '';
        for (let ch of sidText) {
            result += SIDDHAM_TO_DEVANAGARI[ch] || ch;
        }
        return result;
    }

    // ---------- 暴露全局 ----------
    window.sanscript = {
        iastToDevanagari: iastToDevanagari,
        devanagariToIast: devanagariToIast,
        devanagariToSiddham: devanagariToSiddham,
        siddhamToDevanagari: siddhamToDevanagari
    };

})();