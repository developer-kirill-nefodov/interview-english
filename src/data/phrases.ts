import type { Tr } from "../lib/i18n";
export interface PhraseGroup {
  title: string;
  tr: Tr;
  phrases: { en: string; tr: Tr }[];
}

export const PHRASEBOOK: PhraseGroup[] = [
  {
    title: "Buying time to think",
    tr: { ru: "Взять паузу на размышление", uk: "Взяти паузу, щоб подумати" },
    phrases: [
      {
        en: "That's a good question. Let me think about it for a second.",
        tr: { ru: "Хороший вопрос. Дайте секунду подумать.", uk: "Гарне питання. Дайте секунду подумати." },
      },
      {
        en: "Give me a moment to structure my thoughts.",
        tr: { ru: "Дайте мне минутку собраться с мыслями.", uk: "Дайте мені хвилинку зібратися з думками." },
      },
      { en: "Let me think out loud, if that's okay.", tr: { ru: "Позвольте порассуждать вслух.", uk: "Дозвольте поміркувати вголос." } },
      { en: "Hmm, let me see…", tr: { ru: "Хм, сейчас посмотрим…", uk: "Хм, зараз подивимось…" } },
    ],
  },
  {
    title: "When you didn't understand",
    tr: { ru: "Если не поняли вопрос", uk: "Якщо не зрозуміли питання" },
    phrases: [
      {
        en: "Sorry, could you repeat the question?",
        tr: { ru: "Извините, можете повторить вопрос?", uk: "Вибачте, можете повторити питання?" },
      },
      { en: "Could you rephrase that, please?", tr: { ru: "Можете переформулировать?", uk: "Можете переформулювати?" } },
      {
        en: "Just to make sure I understand, you're asking about …, right?",
        tr: { ru: "Чтобы убедиться, что понял: вы спрашиваете о …, верно?", uk: "Щоб переконатися, що я зрозумів: ви питаєте про …, так?" },
      },
      {
        en: "Could you speak a little more slowly, please?",
        tr: { ru: "Можете говорить чуть медленнее?", uk: "Можете говорити трохи повільніше?" },
      },
      { en: "Do you mean … or …?", tr: { ru: "Вы имеете в виду … или …?", uk: "Ви маєте на увазі … чи …?" } },
    ],
  },
  {
    title: "When you don't know the answer",
    tr: { ru: "Если не знаете ответ", uk: "Якщо не знаєте відповіді" },
    phrases: [
      {
        en: "I haven't worked with that directly, but here's how I would approach it.",
        tr: {
          ru: "Я не работал с этим напрямую, но вот как бы я подошёл.",
          uk: "Я не працював із цим безпосередньо, але ось як би я підійшов.",
        },
      },
      {
        en: "I'm not 100% sure, but my guess would be …",
        tr: { ru: "Не уверен на 100%, но предположу, что …", uk: "Не впевнений на 100%, але припускаю, що …" },
      },
      { en: "I don't know, but I'd find out by …", tr: { ru: "Не знаю, но выяснил бы так: …", uk: "Не знаю, але з'ясував би так: …" } },
      {
        en: "I've read about it, but I don't have hands-on experience.",
        tr: { ru: "Читал об этом, но практического опыта нет.", uk: "Читав про це, але практичного досвіду немає." },
      },
    ],
  },
  {
    title: "Structuring your answer",
    tr: { ru: "Структура ответа", uk: "Структура відповіді" },
    phrases: [
      {
        en: "There are three main points here. First, … Second, … And finally, …",
        tr: {
          ru: "Здесь три основных момента. Во-первых… Во-вторых… И наконец…",
          uk: "Тут три основні моменти. По-перше… По-друге… І нарешті…",
        },
      },
      {
        en: "In short, … Let me explain in more detail.",
        tr: { ru: "Если коротко, … Объясню подробнее.", uk: "Якщо коротко, … Поясню докладніше." },
      },
      { en: "For example, …", tr: { ru: "Например, …", uk: "Наприклад, …" } },
      {
        en: "On the one hand, … On the other hand, …",
        tr: { ru: "С одной стороны… С другой стороны…", uk: "З одного боку… З іншого боку…" },
      },
      { en: "To sum up, …", tr: { ru: "Подводя итог, …", uk: "Підсумовуючи, …" } },
      {
        en: "It depends on … If …, I would … If …, I would …",
        tr: { ru: "Зависит от … Если …, я бы … Если …, я бы …", uk: "Залежить від … Якщо …, я б … Якщо …, я б …" },
      },
    ],
  },
  {
    title: "Talking about your experience",
    tr: { ru: "Рассказ об опыте", uk: "Розповідь про досвід" },
    phrases: [
      {
        en: "I have three years of experience with React.",
        tr: { ru: "У меня три года опыта с React.", uk: "У мене три роки досвіду з React." },
      },
      { en: "I've been working at … since 2023.", tr: { ru: "Работаю в … с 2023 года.", uk: "Працюю в … з 2023 року." } },
      { en: "I was responsible for …", tr: { ru: "Я отвечал за …", uk: "Я відповідав за …" } },
      { en: "I took the initiative to …", tr: { ru: "Я по своей инициативе …", uk: "Я з власної ініціативи …" } },
      {
        en: "As a result, we reduced … by 30%.",
        tr: { ru: "В результате мы сократили … на 30%.", uk: "У результаті ми скоротили … на 30%." },
      },
      {
        en: "I collaborated closely with designers and backend engineers.",
        tr: { ru: "Я тесно работал с дизайнерами и бэкенд-разработчиками.", uk: "Я тісно працював із дизайнерами та бекенд-розробниками." },
      },
    ],
  },
  {
    title: "Live coding: narrating",
    tr: { ru: "Лайв-кодинг: комментировать действия", uk: "Лайв-кодинг: коментувати свої дії" },
    phrases: [
      {
        en: "Let me start with a brute-force solution and then optimize it.",
        tr: { ru: "Начну с решения в лоб, потом оптимизирую.", uk: "Почну з рішення в лоб, потім оптимізую." },
      },
      {
        en: "I'm going to use a hash map to store values I've already seen.",
        tr: { ru: "Использую хеш-таблицу для уже встреченных значений.", uk: "Використаю хеш-таблицю для вже знайдених значень." },
      },
      {
        en: "This loop iterates over each element once.",
        tr: { ru: "Этот цикл проходит по каждому элементу один раз.", uk: "Цей цикл проходить по кожному елементу один раз." },
      },
      {
        en: "Let me double-check this edge case.",
        tr: { ru: "Перепроверю этот граничный случай.", uk: "Перевірю ще раз цей граничний випадок." },
      },
      {
        en: "I think there's an off-by-one error here.",
        tr: { ru: "Кажется, здесь ошибка на единицу.", uk: "Здається, тут помилка на одиницю." },
      },
      {
        en: "Let me rename this variable to make it clearer.",
        tr: { ru: "Переименую переменную, чтобы было понятнее.", uk: "Перейменую змінну, щоб було зрозуміліше." },
      },
      {
        en: "Can I use a built-in method here, or should I implement it myself?",
        tr: {
          ru: "Можно использовать встроенный метод или реализовать самому?",
          uk: "Можна використати вбудований метод чи реалізувати самому?",
        },
      },
    ],
  },
  {
    title: "Live coding: complexity",
    tr: { ru: "Лайв-кодинг: сложность", uk: "Лайв-кодинг: складність" },
    phrases: [
      {
        en: "The time complexity is O of n, because we traverse the array once.",
        tr: { ru: "Временная сложность O(n), так как один проход по массиву.", uk: "Часова складність O(n), бо це один прохід масивом." },
      },
      {
        en: "It's O of n log n because of the sorting step.",
        tr: { ru: "O(n log n) из-за сортировки.", uk: "O(n log n) через сортування." },
      },
      {
        en: "The space complexity is constant — we only use a few variables.",
        tr: { ru: "Память O(1) — только несколько переменных.", uk: "Пам'ять O(1) — лише кілька змінних." },
      },
      {
        en: "We trade memory for speed here.",
        tr: { ru: "Здесь мы жертвуем памятью ради скорости.", uk: "Тут ми жертвуємо пам'яттю заради швидкості." },
      },
    ],
  },
  {
    title: "Pronunciation of tech terms",
    tr: { ru: "Произношение терминов", uk: "Вимова термінів" },
    phrases: [
      { en: "cache — sounds like “cash”", tr: { ru: "кэш — как «кэш», не «кейч»", uk: "кеш — як «кеш», не «кейч»" } },
      { en: "queue — sounds like the letter Q", tr: { ru: "очередь — как буква Q, «кью»", uk: "черга — як літера Q, «к'ю»" } },
      { en: "SQL — “sequel” or S-Q-L", tr: { ru: "«сиквел» или «эс-кью-эл»", uk: "«сіквел» або «ес-к'ю-ел»" } },
      { en: "GUI — “gooey”", tr: { ru: "«гуи»", uk: "«ґуі»" } },
      { en: "char — like the start of “character”", tr: { ru: "«кэр», как в character", uk: "«кер», як у character" } },
      { en: "Linux — LIN-ux", tr: { ru: "«ЛИН-укс»", uk: "«ЛІН-укс»" } },
      {
        en: "width / height — “wid-th” (not “wids”) / “hite”",
        tr: {
          ru: "ширина/высота — «уидθ» с межзубным th, не «уидс» / «хайт»",
          uk: "ширина/висота — «уідθ» з міжзубним th, не «уідс» / «хайт»",
        },
      },
      { en: "suite (test suite) — sounds like “sweet”", tr: { ru: "«свит», не «сьют»", uk: "«світ», не «сьют»" } },
    ],
  },
];
