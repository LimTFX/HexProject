// ==================== МОДУЛЬ АЛФАВИТОВ (МАССИВЫ) ====================
// Латинский алфавит (Английский) - 26 букв
const LATIN_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LATIN_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Кириллический алфавит (русский) - 33 буквы
const CYRILLIC_LOWER = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('');
const CYRILLIC_UPPER = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

// Объект для хранения состояния приложения (демонстрация использования объектов)
const appState = {
    lastProcessed: '',
    currentAlgorithm: 'caesar',
    lastShift: 3
};

// Очередь уведомлений (чтобы не перекрывались)
let notificationQueue = [];
let isShowingNotification = false;

const showNotification = (msg, isError = false) => {
    notificationQueue.push({ msg, isError });
    processNotificationQueue();
}

const processNotificationQueue = () => {
    if (isShowingNotification || notificationQueue.length === 0) return;
    
    isShowingNotification = true;
    const { msg, isError } = notificationQueue.shift();
    
    const toastDiv = document.getElementById('toastNotification');
    const notif = document.createElement('div');
    notif.className = 'notification' + (isError ? ' error-notif' : '');
    notif.innerText = msg;
    toastDiv.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => {
            notif.remove();
            isShowingNotification = false;
            processNotificationQueue();
        }, 300);
    }, 2800);
}

// ==================== ОПРЕДЕЛЕНИЕ ЯЗЫКА ====================
const detectLanguage = (text) => {
    if (!text || text.trim() === '') return 'unknown';
    
    let hasCyrillic = false;
    let hasLatin = false;
    
    for (let char of text) {
        if (/[а-яА-ЯёЁ]/.test(char)) {
            hasCyrillic = true;
        } else if (/[a-zA-Z]/.test(char)) {
            hasLatin = true;
        }
        
        if (hasCyrillic && hasLatin) {
            return 'mixed';
        }
    }
    
    if (hasCyrillic && !hasLatin) return 'ru';
    if (hasLatin && !hasCyrillic) return 'en';
}

// Проверка, есть ли в тексте хотя бы одна буква
const hasLetters = (text) => /[a-zA-Zа-яА-ЯёЁ]/.test(text);

// Обновление UI информации о языке
const updateLanguageInfo = (text) => {
    const langDetectSpan = document.getElementById('langDetect');
    const charCountSpan = document.getElementById('charCount');
    const lang = detectLanguage(text);
    const letterCount = (text.match(/[а-яА-ЯёЁa-zA-Z]/g) || []).length;
    
    switch(lang) {
        case 'ru':
            langDetectSpan.innerHTML = 'Русский (только кириллица)';
            break;
        case 'en':
            langDetectSpan.innerHTML = 'English (только латиница)';
            break;
        case 'mixed':
            langDetectSpan.innerHTML = 'Смешанный';
            break;
        default:
            langDetectSpan.innerHTML = 'Буквы не обнаружены';
    }
    
    charCountSpan.innerHTML = `Символов: ${text.length} | Букв: ${letterCount}`;
    return lang;
}

// ==================== ВАЛИДАЦИЯ СДВИГА С УЧЁТОМ ЯЗЫКА ====================
const getValidShiftForLanguage = (lang) => {
    let shiftRaw = document.getElementById('shiftValue').value;
    let shiftNum = parseInt(shiftRaw, 10);
    
    let maxShift = 32;
    if (lang === 'en') maxShift = 25;
    else if (lang === 'ru') maxShift = 32;
    else maxShift = 32; // для mixed используем 32 (обработка каждого символа отдельно)
    
    if (isNaN(shiftNum)) {
        showNotification(`Сдвиг должен быть числом, установлен 3`, true);
        document.getElementById('shiftValue').value = 3;
        return 3;
    }
    
    // Максимальный сдвиг 33 (для кириллицы), но для латиницы сработает mod 26
    if (shiftNum < 1) {
        showNotification(`Сдвиг не может быть меньше 1, установлен 1`, true);
        document.getElementById('shiftValue').value = 1;
        return 1;
    }
    
    if (shiftNum > maxShift) {
        showNotification(`Сдвиг не может быть больше ${maxShift} для ${lang === 'en' ? 'английского' : 'данного'} текста, установлен ${maxShift}`, true);
        document.getElementById('shiftValue').value = maxShift;
        return maxShift;
    }
    return shiftNum;
}

// ==================== АЛГОРИТМЫ ====================
// ==== АЛГОРИТМ ЦЕЗАРЯ ====
const caesarCipherWithAutoLang = (text, shift, mode = 'encrypt') => {
    let result = '';
    
    for (let char of text) {
        let processed = false;
        
        // Проверка для кириллицы
        if (CYRILLIC_LOWER.includes(char)) {
            let idx = CYRILLIC_LOWER.indexOf(char);
            let shiftMod = (mode === 'encrypt') ? shift : -shift;
            let newIdx = (idx + shiftMod) % 33;
            if (newIdx < 0) newIdx += 33;
            result += CYRILLIC_LOWER[newIdx];
            processed = true;
        }
        else if (CYRILLIC_UPPER.includes(char)) {
            let idx = CYRILLIC_UPPER.indexOf(char);
            let shiftMod = (mode === 'encrypt') ? shift : -shift;
            let newIdx = (idx + shiftMod) % 33;
            if (newIdx < 0) newIdx += 33;
            result += CYRILLIC_UPPER[newIdx];
            processed = true;
        }
        // Проверка для латиницы
        else if (LATIN_LOWER.includes(char)) {
            let idx = LATIN_LOWER.indexOf(char);
            let shiftMod = (mode === 'encrypt') ? shift : -shift;
            let newIdx = (idx + shiftMod) % 26;
            if (newIdx < 0) newIdx += 26;
            result += LATIN_LOWER[newIdx];
            processed = true;
        }
        else if (LATIN_UPPER.includes(char)) {
            let idx = LATIN_UPPER.indexOf(char);
            let shiftMod = (mode === 'encrypt') ? shift : -shift;
            let newIdx = (idx + shiftMod) % 26;
            if (newIdx < 0) newIdx += 26;
            result += LATIN_UPPER[newIdx];
            processed = true;
        }
        
        if (!processed) {
            result += char; // неалфавитные символы остаются без изменений
        }
    }
    return result;
}

// ==== АЛГОРИТМ АТБАШ ====
const atbashCipherWithAutoLang = (text) => {
    let result = '';
    
    for (let char of text) {
        // Кириллица нижний регистр
        if (CYRILLIC_LOWER.includes(char)) {
            let idx = CYRILLIC_LOWER.indexOf(char);
            result += CYRILLIC_LOWER[32 - idx]; // 33 буквы, индекс 0-32
        }
        // Кириллица верхний регистр
        else if (CYRILLIC_UPPER.includes(char)) {
            let idx = CYRILLIC_UPPER.indexOf(char);
            result += CYRILLIC_UPPER[32 - idx];
        }
        // Латиница нижний регистр
        else if (LATIN_LOWER.includes(char)) {
            let idx = LATIN_LOWER.indexOf(char);
            result += LATIN_LOWER[25 - idx];
        }
        // Латиница верхний регистр
        else if (LATIN_UPPER.includes(char)) {
            let idx = LATIN_UPPER.indexOf(char);
            result += LATIN_UPPER[25 - idx];
        }
        else {
            result += char;
        }
    }
    return result;
}

// ==================== ОСНОВНОЙ ДИСПЕТЧЕР ====================
const processText = () => {
    const input = document.getElementById('inputText').value;
    
    if (!input.trim()) {
        showNotification('Ошибка: введите текст для шифрования/дешифрования!', true);
        return;
    }

    // Проверка на наличие букв
    if (!hasLetters(input)) {
        showNotification('Ошибка: текст должен содержать хотя бы одну букву (русскую или английскую)!', true);
        return;
    }
    
    // Обновляем информацию о языке
    const detectedLang = updateLanguageInfo(input);
    const cipherType = document.getElementById('cipherType').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let output = '';
    
    if (cipherType === 'caesar') {
        // Получаем валидный сдвиг с учётом языка
        let shift = getValidShiftForLanguage(detectedLang);
        appState.lastShift = shift;
        output = caesarCipherWithAutoLang(input, shift, mode);
        appState.currentAlgorithm = 'caesar';
        showNotification(`Шифр Цезаря: ${mode === 'encrypt' ? 'шифрование' : 'дешифрование'} выполнено со сдвигом ${shift}`);
    } 
    else {
        output = atbashCipherWithAutoLang(input);
        appState.currentAlgorithm = 'atbash';
        showNotification(`Шифр Атбаш: ${mode === 'encrypt' ? 'шифрование' : 'дешифрование'} выполнено`);
    }
    
    document.getElementById('outputArea').innerText = output;
    appState.lastProcessed = output;
}

// ==================== РАБОТА С ФАЙЛАМИ ====================
const saveResultToFile = () => {
    const outputText = document.getElementById('outputArea').innerText;
    if (!outputText || outputText === '(результат появится здесь)' || outputText.trim() === '') {
        showNotification('Нет результата для сохранения! Сначала выполните операцию.', true);
        return;
    }
    
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `cipher_${appState.currentAlgorithm}_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Файл успешно сохранён!');
}

const loadFile = () => {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
            showNotification('Пожалуйста, выберите текстовый файл .txt', true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target.result;
            document.getElementById('inputText').value = content;
            updateLanguageInfo(content);
            updateShiftMaxHint();
            showNotification(`Файл "${file.name}" загружен. Теперь выберите режим и нажмите "Выполнить".`);
            fileInput.value = '';
        };
        reader.onerror = () => {
            showNotification('Ошибка при чтении файла', true);
            fileInput.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    };
}

const clearAll = () => {
    document.getElementById('inputText').value = '';
    document.getElementById('outputArea').innerHTML = '(результат появится здесь)';
    updateLanguageInfo('');
    showNotification('Всё очищено', false);
}

// ==================== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ====================
const toggleShiftField = () => {
    const cipherSelect = document.getElementById('cipherType');
    const shiftGroup = document.getElementById('shiftGroup');
    if (cipherSelect.value === 'atbash') {
        shiftGroup.style.display = 'none';
    } else {
        shiftGroup.style.display = 'block';
    }
}

// Обновление максимального сдвига в зависимости от преобладающего языка (для подсказки)
const updateShiftMaxHint = () => {
    const input = document.getElementById('inputText').value;
    const lang = detectLanguage(input);
    const shiftInput = document.getElementById('shiftValue');
    
    if (lang === 'en') {
        shiftInput.max = 25;
        shiftInput.placeholder = '1-25 (латиница)';
        if (parseInt(shiftInput.value) > 25) {
            shiftInput.value = 25;
        }
    } else {
        shiftInput.max = 32;
        shiftInput.placeholder = '1-32 (универсальный)';
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('processBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadFileBtn');
    const clearBtn = document.getElementById('clearBtn');
    const cipherSelect = document.getElementById('cipherType');
    const inputText = document.getElementById('inputText');
    const shiftValue = document.getElementById('shiftValue');
    
    processBtn.addEventListener('click', processText);
    saveBtn.addEventListener('click', saveResultToFile);
    loadBtn.addEventListener('click', loadFile);
    clearBtn.addEventListener('click', clearAll);
    cipherSelect.addEventListener('change', toggleShiftField);
    
    inputText.addEventListener('input', () => {
        updateLanguageInfo(inputText.value);
        updateShiftMaxHint();
    });
    
    shiftValue.addEventListener('change', () => {
        let val = parseInt(shiftValue.value, 10);
        const lang = detectLanguage(inputText.value);
        const maxVal = (lang === 'en') ? 25 : 32;
        
        if (isNaN(val)) {
            shiftValue.value = 3;
        } else if (val < 1) {
            shiftValue.value = 1;
        } else if (val > maxVal) {
            shiftValue.value = maxVal;
        }
    });
    
    toggleShiftField();
    updateLanguageInfo('');
    updateShiftMaxHint();
    showNotification('Приложение выполняется | Поддерживаются русский и английский алфавиты', false);
});