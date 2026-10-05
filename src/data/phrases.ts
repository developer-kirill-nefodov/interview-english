export interface PhraseGroup {
  title: string;
  ru: string;
  phrases: { en: string; ru: string }[];
}

export const PHRASEBOOK: PhraseGroup[] = [
  {
    title: "Buying time to think",
    ru: "Взять паузу на размышление",
    phrases: [
      { en: "That's a good question. Let me think about it for a second.", ru: "Хороший вопрос. Дайте секунду подумать." },
      { en: "Give me a moment to structure my thoughts.", ru: "Дайте мне минутку собраться с мыслями." },
      { en: "Let me think out loud, if that's okay.", ru: "Позвольте порассуждать вслух." },
      { en: "Hmm, let me see…", ru: "Хм, сейчас посмотрим…" },
    ],
  },
  {
    title: "When you didn't understand",
    ru: "Если не поняли вопрос",
    phrases: [
      { en: "Sorry, could you repeat the question?", ru: "Извините, можете повторить вопрос?" },
      { en: "Could you rephrase that, please?", ru: "Можете переформулировать?" },
      { en: "Just to make sure I understand, you're asking about …, right?", ru: "Чтобы убедиться, что понял: вы спрашиваете о …, верно?" },
      { en: "Could you speak a little more slowly, please?", ru: "Можете говорить чуть медленнее?" },
      { en: "Do you mean … or …?", ru: "Вы имеете в виду … или …?" },
    ],
  },
  {
    title: "When you don't know the answer",
    ru: "Если не знаете ответ",
    phrases: [
      { en: "I haven't worked with that directly, but here's how I would approach it.", ru: "Я не работал с этим напрямую, но вот как бы я подошёл." },
      { en: "I'm not 100% sure, but my guess would be …", ru: "Не уверен на 100%, но предположу, что …" },
      { en: "I don't know, but I'd find out by …", ru: "Не знаю, но выяснил бы так: …" },
      { en: "I've read about it, but I don't have hands-on experience.", ru: "Читал об этом, но практического опыта нет." },
    ],
  },
  {
    title: "Structuring your answer",
    ru: "Структура ответа",
    phrases: [
      { en: "There are three main points here. First, … Second, … And finally, …", ru: "Здесь три основных момента. Во-первых… Во-вторых… И наконец…" },
      { en: "In short, … Let me explain in more detail.", ru: "Если коротко, … Объясню подробнее." },
      { en: "For example, …", ru: "Например, …" },
      { en: "On the one hand, … On the other hand, …", ru: "С одной стороны… С другой стороны…" },
      { en: "To sum up, …", ru: "Подводя итог, …" },
      { en: "It depends on … If …, I would … If …, I would …", ru: "Зависит от … Если …, я бы … Если …, я бы …" },
    ],
  },
  {
    title: "Talking about your experience",
    ru: "Рассказ об опыте",
    phrases: [
      { en: "I have three years of experience with React.", ru: "У меня три года опыта с React." },
      { en: "I've been working at … since 2023.", ru: "Работаю в … с 2023 года." },
      { en: "I was responsible for …", ru: "Я отвечал за …" },
      { en: "I took the initiative to …", ru: "Я по своей инициативе …" },
      { en: "As a result, we reduced … by 30%.", ru: "В результате мы сократили … на 30%." },
      { en: "I collaborated closely with designers and backend engineers.", ru: "Я тесно работал с дизайнерами и бэкенд-разработчиками." },
    ],
  },
  {
    title: "Live coding: narrating",
    ru: "Лайв-кодинг: комментировать действия",
    phrases: [
      { en: "Let me start with a brute-force solution and then optimize it.", ru: "Начну с решения в лоб, потом оптимизирую." },
      { en: "I'm going to use a hash map to store values I've already seen.", ru: "Использую хеш-таблицу для уже встреченных значений." },
      { en: "This loop iterates over each element once.", ru: "Этот цикл проходит по каждому элементу один раз." },
      { en: "Let me double-check this edge case.", ru: "Перепроверю этот граничный случай." },
      { en: "I think there's an off-by-one error here.", ru: "Кажется, здесь ошибка на единицу." },
      { en: "Let me rename this variable to make it clearer.", ru: "Переименую переменную, чтобы было понятнее." },
      { en: "Can I use a built-in method here, or should I implement it myself?", ru: "Можно использовать встроенный метод или реализовать самому?" },
    ],
  },
  {
    title: "Live coding: complexity",
    ru: "Лайв-кодинг: сложность",
    phrases: [
      { en: "The time complexity is O of n, because we traverse the array once.", ru: "Временная сложность O(n), так как один проход по массиву." },
      { en: "It's O of n log n because of the sorting step.", ru: "O(n log n) из-за сортировки." },
      { en: "The space complexity is constant — we only use a few variables.", ru: "Память O(1) — только несколько переменных." },
      { en: "We trade memory for speed here.", ru: "Здесь мы жертвуем памятью ради скорости." },
    ],
  },
  {
    title: "Pronunciation of tech terms",
    ru: "Произношение терминов",
    phrases: [
      { en: "cache — sounds like “cash”", ru: "кэш — как «кэш», не «кейч»" },
      { en: "queue — sounds like the letter Q", ru: "очередь — как буква Q, «кью»" },
      { en: "SQL — “sequel” or S-Q-L", ru: "«сиквел» или «эс-кью-эл»" },
      { en: "GUI — “gooey”", ru: "«гуи»" },
      { en: "char — like the start of “character”", ru: "«кэр», как в character" },
      { en: "Linux — LIN-ux", ru: "«ЛИН-укс»" },
      { en: "width / height — “wid-th” (not “wids”) / “hite”", ru: "ширина/высота — «уидθ» с межзубным th, не «уидс» / «хайт»" },
      { en: "suite (test suite) — sounds like “sweet”", ru: "«свит», не «сьют»" },
    ],
  },
];
