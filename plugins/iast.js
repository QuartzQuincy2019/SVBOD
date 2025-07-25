//iast.js
function iastToDeva(text) {
    const deva = [
        'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', //0-5
        'ऋ', 'ॠ', 'ऌ', 'ॡ', 'ए', 'ऐ', 'ओ', 'औ', //6-13
        'क', 'ख', 'ग', 'घ', 'ङ', //14-18
        'च', 'छ', 'ज', 'झ', 'ञ', //19-23
        'ट', 'ठ', 'ड', 'ढ', 'ण', //24-28
        'त', 'थ', 'द', 'ध', 'न', //29-33
        'प', 'फ', 'ब', 'भ', 'म', //34-38
        'य', 'र', 'ल', 'व', //39-42
        'श', 'ष', 'स', 'ह', //43-46
        'ा', 'ि', 'ी', 'ु', 'ू', //47-51
        'ृ', 'ॄ', 'े', 'ै', 'ो', 'ौ', //52-57
        '्', 'ः', 'ँ' //58-60
    ];
    // 映射表
    const independentVowels = {
        'a': deva[0], 'ā': deva[1], 'i': deva[2], 'ī': deva[3],
        'u': deva[4], 'ū': deva[5], 'ṛ': deva[6], 'ṝ': deva[7],
        'ḷ': deva[8], 'ḹ': deva[9], 'e': deva[10], 'ai': deva[11],
        'o': deva[12], 'au': deva[13]
    };
    const consonants = {
        'k': deva[14], 'kh': deva[15], 'g': deva[16], 'gh': deva[17], 'ṅ': deva[18],
        'c': deva[19], 'ch': deva[20], 'j': deva[21], 'jh': deva[22], 'ñ': deva[23],
        'ṭ': deva[24], 'ṭh': deva[25], 'ḍ': deva[26], 'ḍh': deva[27], 'ṇ': deva[28],
        't': deva[29], 'th': deva[30], 'd': deva[31], 'dh': deva[32], 'n': deva[33],
        'p': deva[34], 'ph': deva[35], 'b': deva[36], 'bh': deva[37], 'm': deva[38],
        'y': deva[39], 'r': deva[40], 'l': deva[41], 'v': deva[42],
        'ś': deva[43], 'ṣ': deva[44], 's': deva[45], 'h': deva[46]
    };
    const vowelSigns = {
        'ā': deva[47], 'i': deva[48], 'ī': deva[49], 'u': deva[50], 'ū': deva[51],
        'ṛ': deva[52], 'ṝ': deva[53], 'e': deva[54], 'ai': deva[55], 'o': deva[56], 'au': deva[57]
    };

    const specials = {
        'ḥ': deva[59], 'ṃ': deva[60]
    };

    const virama = deva[58]; // 止韵符号

    // 所有可能的IAST符号（按长度降序排序，确保优先匹配长序列）
    const allKeys = [
        ...Object.keys(independentVowels),
        ...Object.keys(consonants),
        ...Object.keys(specials)
    ].sort((a, b) => b.length - a.length);

    // 将IAST文本分解为符号序列
    function tokenize(str) {
        let tokens = [];
        let i = 0;
        while (i < str.length) {
            let matched = false;
            for (const key of allKeys) {
                if (str.startsWith(key, i)) {
                    tokens.push(key);
                    i += key.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push(str[i]);
                i++;
            }
        }
        return tokens;
    }

    // 转换逻辑
    const tokens = tokenize(text);
    let result = [];
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];
        if (token in independentVowels) {
            result.push(independentVowels[token]);
            i++;
        } else if (token in consonants) {
            const nextToken = tokens[i + 1];
            // 检查下一个token是否是需要添加virama的情况
            if (
                nextToken === undefined || // 末尾
                nextToken in consonants || // 后跟辅音
                nextToken in specials ||  // 后跟特殊符号
                !(nextToken in independentVowels) // 后跟非元音字符（如空格、标点）
            ) {
                // 先添加辅音+virama
                result.push(consonants[token] + virama);
                i++;
                // 如果后跟特殊符号，需要回退virama并单独处理特殊符号
                if (nextToken in specials) {
                    // 移除刚添加的virama
                    result.pop();
                    // 添加辅音（带a）和特殊符号
                    result.push(consonants[token] + specials[nextToken]);
                    i++; // 额外跳过特殊符号
                }
            } else if (nextToken in independentVowels) {
                if (nextToken === 'a') {
                    result.push(consonants[token]);
                    i += 2;
                } else {
                    result.push(consonants[token] + vowelSigns[nextToken]);
                    i += 2;
                }
            } else {
                result.push(consonants[token] + virama);
                i++;
            }
        } else if (token in specials) {
            result.push(specials[token]);
            i++;
        } else {
            result.push(token);
            i++;
        }
    }

    return result.join('');
}