import type { Tr } from "../lib/i18n";
export type Category = "behavioral" | "frontend" | "backend" | "cs" | "design";

export interface Question {
  id: string;
  category: Category;
  level: "junior" | "middle" | "senior";
  text: string;
  tr: Tr;
  /** What the interviewer is really checking. */
  tips: string[];
  /** Terms a good answer usually mentions; used for offline feedback. */
  keyTerms: string[];
  /** Openers and linking phrases that fit this question. */
  phrases: string[];
  sample: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  behavioral: "Intro & Behavioral",
  frontend: "Frontend",
  backend: "Backend",
  cs: "CS Fundamentals",
  design: "System Design",
};

export const QUESTIONS: Question[] = [
  // ── Behavioral ─────────────────────────────────────────────
  {
    id: "b-intro",
    category: "behavioral",
    level: "junior",
    text: "Tell me about yourself.",
    tr: { ru: "Расскажите о себе.", uk: "Розкажіть про себе." },
    tips: [
      "Keep it to 1–2 minutes: present → past → future.",
      "Focus on work, not your biography.",
      "End with why you are interested in this role.",
    ],
    keyTerms: ["experience", "currently", "build", "enjoy", "grow", "years"],
    phrases: [
      "I'm a … developer with … years of experience in …",
      "Currently, I'm working at … where I …",
      "Before that, I …",
      "What I enjoy most is …",
      "That's why I'm excited about this role.",
    ],
    sample:
      "I'm a frontend developer with about three years of experience, mostly with React and TypeScript. Currently, I work at a fintech startup, where I build the customer dashboard and recently led a migration to a new design system. Before that, I worked at an agency on e-commerce sites. What I enjoy most is turning complex data into simple interfaces. I'm looking for a product company where I can grow toward a senior role, and that's why this position caught my attention.",
  },
  {
    id: "b-challenge",
    category: "behavioral",
    level: "junior",
    text: "Tell me about a difficult technical problem you solved.",
    tr: {
      ru: "Расскажите о сложной технической проблеме, которую вы решили.",
      uk: "Розкажіть про складну технічну проблему, яку ви розв'язали.",
    },
    tips: [
      "Use STAR: Situation, Task, Action, Result.",
      "Spend most of the time on Action — what YOU did.",
      "Give a measurable result if possible.",
    ],
    keyTerms: ["example", "my task", "I found", "as a result", "learned", "measure"],
    phrases: [
      "Let me give you a specific example.",
      "The situation was that …",
      "My task was to …",
      "First, I … Then, I …",
      "As a result, …",
      "What I learned from this is …",
    ],
    sample:
      "Sure, let me give you a specific example. Last year our checkout page became very slow for some users. My task was to find the cause. First, I reproduced it with a large cart and profiled the page. I found that we re-rendered the whole list on every keystroke. I memoized the list items and moved the expensive calculation to the server. As a result, the input delay dropped from about a second to under a hundred milliseconds, and conversion went up by about two percent. What I learned is to measure first and only then optimize.",
  },
  {
    id: "b-conflict",
    category: "behavioral",
    level: "middle",
    text: "Describe a time you disagreed with a teammate. How did you handle it?",
    tr: {
      ru: "Опишите случай, когда вы не согласились с коллегой. Как вы поступили?",
      uk: "Опишіть випадок, коли ви не погодилися з колегою. Як ви вчинили?",
    },
    tips: ["Show you stay respectful and focus on data, not ego.", "Show you can disagree and commit.", "Don't blame the other person."],
    keyTerms: ["opinions", "concerns", "prototype", "compare", "agreed", "team"],
    phrases: [
      "We had different opinions about …",
      "I tried to understand their point of view.",
      "I suggested we compare both options by …",
      "In the end, we agreed to …",
      "Looking back, I would …",
    ],
    sample:
      "We had different opinions about state management in a new project. My teammate wanted Redux, and I thought it was too heavy for our case. First, I asked him to explain his concerns, and it turned out he was worried about debugging. I suggested we build a small prototype with both options and compare. The lighter option was simpler, but we kept his idea of devtools logging. In the end, we agreed on the lighter option, we both felt heard, and the project shipped on time.",
  },
  {
    id: "b-failure",
    category: "behavioral",
    level: "middle",
    text: "Tell me about a mistake you made at work and what you learned.",
    tr: { ru: "Расскажите об ошибке на работе и чему она вас научила.", uk: "Розкажіть про помилку на роботі і чого вона вас навчила." },
    tips: [
      "Pick a real but not catastrophic mistake.",
      "Own it: say “I”, not “we”.",
      "Most of the answer should be about the fix and the lesson.",
    ],
    keyTerms: ["mistake", "responsibility", "rolled it back", "fixed", "learned", "now"],
    phrases: [
      "I take full responsibility for …",
      "As soon as I noticed, I …",
      "To prevent this from happening again, I …",
      "Since then, I always …",
    ],
    sample:
      "My biggest mistake happened early in my career: I deployed a database migration on a Friday evening without testing it on a copy of production data. It locked a big table and the app was down for about twenty minutes. I take full responsibility for that. As soon as I noticed, I rolled it back and informed the team. Then I fixed the process: I added a staging step with production-sized data to our pipeline. What I learned is to test migrations on real data, and now I always ask myself how a change behaves at scale.",
  },
  {
    id: "b-why",
    category: "behavioral",
    level: "junior",
    text: "Why do you want to work here?",
    tr: { ru: "Почему вы хотите работать у нас?", uk: "Чому ви хочете працювати в нас?" },
    tips: [
      "Connect the company's product or mission with your experience.",
      "Be specific — mention something you actually researched.",
      "Avoid talking only about salary or remote work.",
    ],
    keyTerms: ["product", "problem", "experience", "grow", "team", "impact"],
    phrases: [
      "I've been following your product for a while …",
      "What really attracts me is …",
      "My experience with … fits well with …",
      "I'd like to grow in …",
    ],
    sample:
      "I've been using your product for about a year, and I really like how simple the onboarding is. What attracts me most is that you solve a real problem for small businesses, and engineers seem to have real impact on the product. My experience building dashboards with React fits well with your frontend stack. I'd also like to grow in performance and accessibility, which your team clearly cares about.",
  },
  {
    id: "b-questions",
    category: "behavioral",
    level: "junior",
    text: "Do you have any questions for us?",
    tr: { ru: "Есть ли у вас вопросы к нам?", uk: "Чи є у вас питання до нас?" },
    tips: [
      "Always say yes and ask 2–3 questions.",
      "Ask about the team, process and challenges.",
      "Don't ask things you can easily find on the website.",
    ],
    keyTerms: ["team", "structured", "sprints", "success", "challenge", "first three months"],
    phrases: [
      "Yes, I have a few questions.",
      "Could you tell me more about …",
      "What does a typical day look like for …",
      "What would success look like in the first three months?",
      "What's the biggest challenge the team is facing right now?",
    ],
    sample:
      "Yes, I have a few questions. Could you tell me more about how the team is structured and how you plan your work — do you use sprints? What would success look like for this role in the first three months? And what's the biggest technical challenge the team is facing right now?",
  },
  // ── Frontend ───────────────────────────────────────────────
  {
    id: "f-virtual-dom",
    category: "frontend",
    level: "junior",
    text: "How does React decide when to re-render a component?",
    tr: { ru: "Как React решает, когда перерисовать компонент?", uk: "Як React вирішує, коли перемалювати компонент?" },
    tips: [
      "Mention state change, parent re-render, and context change.",
      "Explain reconciliation briefly.",
      "Bonus: memo, useMemo, useCallback and when NOT to use them.",
    ],
    keyTerms: ["state", "props", "parent", "context", "reconciliation", "memo"],
    phrases: [
      "In short, a component re-renders when …",
      "There are three main triggers: …",
      "It's important to note that …",
      "To avoid unnecessary re-renders, you can …",
    ],
    sample:
      "In short, a component re-renders when its state changes, when its parent re-renders, or when a context it uses changes. Props changing is really a consequence of the parent re-rendering. After rendering, React compares the new tree with the previous one — that's reconciliation — and only updates the real DOM where something changed. To avoid unnecessary re-renders you can wrap a component in React.memo and keep props stable with useMemo and useCallback, but I only do that after profiling, because memoization also has a cost.",
  },
  {
    id: "f-event-loop",
    category: "frontend",
    level: "middle",
    text: "Can you explain the JavaScript event loop?",
    tr: { ru: "Объясните, как работает event loop в JavaScript.", uk: "Поясніть, як працює event loop у JavaScript." },
    tips: [
      "Call stack, task queue (macrotasks), microtask queue.",
      "Microtasks (promises) run before the next macrotask (setTimeout).",
      "A short example makes the answer much stronger.",
    ],
    keyTerms: ["call stack", "single-threaded", "microtask", "macrotask", "promise", "setTimeout"],
    phrases: [
      "JavaScript is single-threaded, which means …",
      "The key idea is that …",
      "For example, if you have …",
      "So the order would be …",
    ],
    sample:
      "JavaScript is single-threaded, which means it runs one piece of code at a time on the call stack. Async work like timers or network requests is handled by the browser, and when it finishes, a callback is put into a queue. The event loop waits until the call stack is empty and then takes the next task. The key detail is that there are two queues: microtasks, like promise callbacks, and macrotasks, like setTimeout. After each task, the event loop runs all queued microtasks before it takes the next task. So if you log something synchronously, then in a setTimeout, then in a resolved promise, the order is: sync, promise, timeout.",
  },
  {
    id: "f-performance",
    category: "frontend",
    level: "middle",
    text: "A page in our app loads slowly. How would you investigate it?",
    tr: {
      ru: "Страница в приложении медленно загружается. Как будете искать причину?",
      uk: "Сторінка в застосунку повільно завантажується. Як шукатимете причину?",
    },
    tips: [
      "Show a structured approach: measure → find bottleneck → fix → verify.",
      "Mention concrete tools: Lighthouse, DevTools Performance and Network tabs.",
      "Name typical causes: bundle size, images, blocking requests, re-renders.",
    ],
    keyTerms: ["measure", "Lighthouse", "network", "bundle", "lazy", "caching"],
    phrases: [
      "First of all, I would measure …",
      "I'd start by checking …",
      "Depending on what I find, I would …",
      "Finally, I would verify that …",
    ],
    sample:
      "First of all, I would measure instead of guessing. I'd run Lighthouse and look at Core Web Vitals, then open the Network tab to see what is large or blocking. Common causes are a big JavaScript bundle, unoptimized images, or a slow API call that blocks rendering. Depending on what I find, I would split the bundle and lazy-load routes, compress and resize images, add caching, or show a skeleton while data loads. Finally, I would measure again to verify the improvement and maybe add monitoring so it doesn't regress.",
  },
  {
    id: "f-css",
    category: "frontend",
    level: "junior",
    text: "What's the difference between Flexbox and CSS Grid?",
    tr: { ru: "В чём разница между Flexbox и CSS Grid?", uk: "У чому різниця між Flexbox і CSS Grid?" },
    tips: ["Flexbox is one-dimensional, Grid is two-dimensional.", "Give a practical example of when you'd use each."],
    keyTerms: ["one-dimensional", "two-dimensional", "rows", "columns", "layout", "align"],
    phrases: ["The main difference is that …", "I usually use … for …, and … for …", "For example, …"],
    sample:
      "The main difference is that Flexbox is one-dimensional — it lays items out in a row or a column — while Grid is two-dimensional and controls rows and columns at the same time. I usually use Flexbox for components, like a navbar or aligning a button and an icon, and Grid for page layouts or card galleries where items need to line up in both directions. They work well together.",
  },
  {
    id: "f-state",
    category: "frontend",
    level: "senior",
    text: "How do you decide where state should live in a frontend app?",
    tr: {
      ru: "Как вы решаете, где хранить состояние во фронтенд-приложении?",
      uk: "Як ви вирішуєте, де зберігати стан у фронтенд-застосунку?",
    },
    tips: ["Distinguish server state, global UI state, local state, URL state.", "Show trade-offs, not a single “right” library."],
    keyTerms: ["local", "server state", "global", "URL", "cache", "close"],
    phrases: [
      "It depends on the type of state.",
      "I think of it in a few categories: …",
      "The trade-off here is …",
      "My rule of thumb is …",
    ],
    sample:
      "It depends on the type of state. I think of it in four categories. Server state, like data from the API, I keep in a cache library such as React Query, because it handles loading, refetching and invalidation. Local UI state, like whether a dropdown is open, stays in the component. State that should survive a reload or be shareable, like filters, goes into the URL. And only truly global client state, like the current theme or user session, goes into context or a small store. My rule of thumb is to keep state as close as possible to where it's used and lift it only when needed.",
  },
  // ── Backend ────────────────────────────────────────────────
  {
    id: "be-rest",
    category: "backend",
    level: "junior",
    text: "What makes a REST API well designed?",
    tr: { ru: "Что делает REST API хорошо спроектированным?", uk: "Що робить REST API добре спроєктованим?" },
    tips: ["Resources as nouns, HTTP methods as verbs, correct status codes.", "Mention versioning, pagination, consistent errors."],
    keyTerms: ["resource", "HTTP method", "status code", "pagination", "version", "idempotent"],
    phrases: ["A few things come to mind.", "First, … Second, … And finally, …", "For example, instead of … I would use …"],
    sample:
      "A few things come to mind. First, URLs should describe resources with nouns, like /users/42/orders, and the HTTP method describes the action: GET to read, POST to create, PUT or PATCH to update, DELETE to remove. Second, it should return correct status codes — 201 for created, 404 for not found, 400 for validation errors — and errors should have a consistent format. Third, large lists need pagination and filtering. And finally, I'd version the API and make write operations idempotent where possible, so clients can safely retry.",
  },
  {
    id: "be-index",
    category: "backend",
    level: "middle",
    text: "How do database indexes work, and when would you add one?",
    tr: {
      ru: "Как работают индексы в базе данных и когда их стоит добавлять?",
      uk: "Як працюють індекси в базі даних і коли їх варто додавати?",
    },
    tips: [
      "B-tree, faster reads, slower writes, extra storage.",
      "Mention EXPLAIN / query plans.",
      "Composite index and column order are a bonus.",
    ],
    keyTerms: ["B-tree", "logarithmic", "insert", "EXPLAIN", "composite", "trade-off"],
    phrases: [
      "Basically, an index is like …",
      "The trade-off is that …",
      "I would add one when …",
      "To confirm, I'd look at the query plan.",
    ],
    sample:
      "Basically, an index is like the index at the back of a book. Most databases store it as a B-tree, so instead of scanning the whole table, the database can find rows in logarithmic time. The trade-off is that every insert or update also has to update the index, and it takes extra storage. I would add one when a slow query filters or sorts by a column on a large table. Before and after, I'd check the query plan with EXPLAIN. For queries filtering by several columns, a composite index helps, and the column order matters.",
  },
  {
    id: "be-auth",
    category: "backend",
    level: "middle",
    text: "What's the difference between authentication and authorization? How would you implement them?",
    tr: {
      ru: "В чём разница между аутентификацией и авторизацией? Как бы вы их реализовали?",
      uk: "У чому різниця між автентифікацією та авторизацією? Як би ви їх реалізували?",
    },
    tips: [
      "Authentication = who you are; authorization = what you can do.",
      "Mention sessions vs JWT and their trade-offs.",
      "Security details: hashing passwords, HTTPS, token expiry.",
    ],
    keyTerms: ["who are you", "permissions", "session", "JWT", "hash", "role"],
    phrases: [
      "Authentication answers the question …, while authorization answers …",
      "There are two common approaches: …",
      "One thing to be careful about is …",
    ],
    sample:
      "Authentication answers the question “who are you?”, while authorization answers “what are you allowed to do?”. For authentication, the user logs in, we verify the password against a stored hash created with something like bcrypt, and then issue either a session cookie or a JWT. Sessions are easy to revoke; JWTs are stateless but harder to invalidate, so I'd keep them short-lived with a refresh token. For authorization, I'd usually start with role-based access control and check permissions on the server for every request — never only on the client.",
  },
  {
    id: "be-scale",
    category: "backend",
    level: "senior",
    text: "Our API is getting too much traffic. What would you do?",
    tr: { ru: "API не справляется с нагрузкой. Что будете делать?", uk: "API не витримує навантаження. Що робитимете?" },
    tips: [
      "Ask clarifying questions first: reads or writes? what's the bottleneck?",
      "Caching, horizontal scaling, load balancer, DB read replicas, rate limiting, queues.",
    ],
    keyTerms: ["bottleneck", "caching", "horizontal", "load balancer", "replica", "queue"],
    phrases: [
      "Before jumping to solutions, I'd like to understand …",
      "It depends on where the bottleneck is.",
      "A quick win would be …",
      "In the longer term, …",
    ],
    sample:
      "Before jumping to solutions, I'd like to understand where the bottleneck is — CPU on the app servers, the database, or an external service — and whether the traffic is mostly reads or writes. A quick win for read-heavy traffic is caching, with Redis or a CDN for public data. If the app servers are the bottleneck, I'd make them stateless and scale horizontally behind a load balancer. For the database, read replicas and fixing slow queries. Heavy work that doesn't need an immediate answer can go to a queue. And I'd add rate limiting to protect the system from abuse.",
  },
  // ── CS Fundamentals ────────────────────────────────────────
  {
    id: "cs-bigo",
    category: "cs",
    level: "junior",
    text: "What is Big O notation, and why does it matter?",
    tr: { ru: "Что такое нотация Big O и почему она важна?", uk: "Що таке нотація Big O і чому вона важлива?" },
    tips: ["It describes how time or memory grows with input size.", "Give examples: O(1), O(n), O(log n), O(n²)."],
    keyTerms: ["input", "grows", "worst case", "O(n)", "O(log n)", "constant"],
    phrases: ["Big O describes how …", "For example, …", "In practice, it matters because …"],
    sample:
      "Big O describes how the running time or memory of an algorithm grows as the input gets bigger, usually in the worst case. For example, accessing an array element by index is O(1), constant time; a simple loop over the array is O(n); binary search is O(log n); and two nested loops are O(n squared). In practice, it matters because an O(n squared) solution may be fine for a hundred items but completely unusable for a million.",
  },
  {
    id: "cs-hashmap",
    category: "cs",
    level: "junior",
    text: "How does a hash map work?",
    tr: { ru: "Как работает хеш-таблица?", uk: "Як працює хеш-таблиця?" },
    tips: ["Hash function → bucket index.", "Collisions and how they are handled.", "Average O(1), worst O(n)."],
    keyTerms: ["hash function", "bucket", "collision", "O(1)", "resize", "key"],
    phrases: ["Under the hood, …", "The tricky part is …", "On average, …, but in the worst case …"],
    sample:
      "Under the hood, a hash map is an array of buckets. When you insert a key, a hash function turns the key into a number, which is mapped to a bucket index. The tricky part is collisions, when two keys land in the same bucket — they are usually stored in a small list or tree in that bucket. On average, insert and lookup are O(1), but in the worst case, if everything collides, it becomes O(n). When the map gets too full, it resizes and rehashes all the keys.",
  },
  {
    id: "cs-process-thread",
    category: "cs",
    level: "middle",
    text: "What's the difference between a process and a thread?",
    tr: { ru: "В чём разница между процессом и потоком?", uk: "У чому різниця між процесом і потоком?" },
    tips: ["Memory isolation vs shared memory.", "Cost of creation and context switching.", "Race conditions with threads."],
    keyTerms: ["memory", "isolated", "share", "context switch", "race condition", "lighter"],
    phrases: ["The main difference is …", "Because of that, …", "A practical example is …"],
    sample:
      "The main difference is memory. A process has its own isolated memory space, while threads inside one process share the same memory. Because of that, threads are lighter, faster to create, and can communicate through shared memory, but you have to be careful about race conditions and use locks or other synchronization. Switching between threads is also cheaper than a context switch between processes. Processes are safer — if one crashes, it doesn't take down the others. A practical example is Chrome, which runs each tab in a separate process for stability and security.",
  },
  // ── System design ──────────────────────────────────────────
  {
    id: "sd-url",
    category: "design",
    level: "middle",
    text: "How would you design a URL shortener like bit.ly?",
    tr: {
      ru: "Как бы вы спроектировали сокращатель ссылок вроде bit.ly?",
      uk: "Як би ви спроєктували скорочувач посилань на кшталт bit.ly?",
    },
    tips: [
      "Start with requirements and rough numbers.",
      "API, data model, short-code generation, redirects, caching.",
      "Talk through trade-offs out loud.",
    ],
    keyTerms: ["requirements", "API", "database", "cache", "redirect", "read-heavy"],
    phrases: [
      "Let me start by clarifying the requirements.",
      "Let's assume we have about …",
      "At a high level, the system would have …",
      "One trade-off here is …",
      "If we need to scale further, …",
    ],
    sample:
      "Let me start by clarifying the requirements: users create a short link and get redirected when they open it; reads are much more frequent than writes. Let's assume a hundred million redirects a day. At a high level, there's an API with two endpoints — POST to create a link and GET /:code to redirect — and a key-value store that maps code to URL. For codes, I'd use a base62 encoding of a unique ID, so seven characters are enough for billions of links. Since it's read-heavy, I'd put a cache like Redis in front of the database and return a 301 or 302 redirect. One trade-off is that a 301 is cached by browsers, which is faster but means we lose click analytics.",
  },
  {
    id: "sd-chat",
    category: "design",
    level: "senior",
    text: "How would you design a simple chat application?",
    tr: { ru: "Как бы вы спроектировали простое приложение-чат?", uk: "Як би ви спроєктували простий застосунок-чат?" },
    tips: [
      "Real-time delivery: WebSockets.",
      "Message storage, online status, delivery when offline.",
      "Scaling WebSocket servers with pub/sub.",
    ],
    keyTerms: ["WebSocket", "real-time", "database", "offline", "pub/sub", "scaling"],
    phrases: [
      "First, let me clarify the scope …",
      "For real-time delivery, I would use …",
      "The interesting challenge here is …",
      "To scale this, …",
    ],
    sample:
      "First, let me clarify the scope: one-to-one and small group chats, message history, and online status. For real-time delivery, I'd use WebSockets, so the server can push messages to clients. When a user sends a message, the server saves it to the database and then pushes it to the recipients who are online; offline users get it when they reconnect, or via a push notification. The interesting challenge is scaling: users in the same chat may be connected to different servers, so I'd use a pub/sub system like Redis to route messages between servers. For storage, a database partitioned by chat ID works well because we usually read messages by chat.",
  },
];
