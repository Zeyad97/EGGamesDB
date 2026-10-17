import type { Game, GameFilters } from "@/types";

/**
 * Safe, static demo catalog.
 *
 * These listings let visitors see the populated storefront design while
 * Supabase has no approved games or is unreachable. They are plain static
 * data: no runtime Steam API fetches, no database reads or writes.
 *
 * - IDs and slugs are prefixed with `demo-` so they can never be confused
 *   with real database rows (whose ids are UUIDs).
 * - `average_rating`, `rating_count`, and `view_count` below are illustrative
 *   sample figures for layout purposes only: they are NOT official Steam
 *   ratings and must never be presented as such.
 * - Media URLs and store links point at public Steam CDN/store pages.
 */

const ABOHeader = (path: string) => `https://shared.akamai.steamstatic.com${path}?t=1522447132`;
const KNIGHTSHeader = (path: string) => `https://shared.akamai.steamstatic.com${path}?t=1583011915`;
const LIGHTHeader = (path: string) => `https://shared.akamai.steamstatic.com${path}?t=1789408898`;

const aboScreenshots = [
  "ss_4ca40f4ccdd517a8ecab470fd31b463bac00d239",
  "ss_ad56ba7bab5554c2b751465f1d445a35e78850d0",
  "ss_b60fcc6544022bbdc3bb3130b32e6b34a6be6756",
  "ss_6320f687638ef8d8a348601e38aad0be25f82bda",
  "ss_494330c53a7b6d68c3979443647ed4eb8be16f66",
  "ss_40300ee460c7b149606eed57fd79d874af0202f4",
].map((hash, index) => ({
  id: `demo-abo-khashem-ss-${index}`,
  path_full: ABOHeader(`/store_item_assets/steam/apps/662840/${hash}.1920x1080.jpg`),
  path_thumbnail: ABOHeader(`/store_item_assets/steam/apps/662840/${hash}.600x338.jpg`),
}));

const knightsScreenshots = [
  "ss_2419deb2755cdf9cfaad0a0af178fabe42d81969",
  "ss_d489a75e962018c6c782fe65a6cb5ba45d04221b",
  "ss_2f71ab7fa9cd94fffc4d602cf79805e66af0fde1",
  "ss_f9d619a99e95afa4966bfcfc285e463d3bc234bb",
  "ss_043e0c4e3a8e6f96b9fae82e9f1d0597841d39df",
].map((hash, index) => ({
  id: `demo-knights-of-light-ss-${index}`,
  path_full: KNIGHTSHeader(`/store_item_assets/steam/apps/1159700/${hash}.1920x1080.jpg`),
  path_thumbnail: KNIGHTSHeader(`/store_item_assets/steam/apps/1159700/${hash}.600x338.jpg`),
}));

const lightDudeHashes = [
  "bd1a88387674c80eedc5fd7a5234ac1065f28fee",
  "fd59349702aecf2c738f6f4ae4103eb7c274e524",
  "24f6edaa59e0f18457a0b99d7994a3bd7fe5d35a",
  "a85b17ca7dd974708950904a21415a637cf9202c",
  "0246cc85d139818f8443149caa6fce7495d210c9",
  "07c7f2641f6c9049161221eff51717a49f38be91",
];
const lightDudeScreenshots = lightDudeHashes.map((hash, index) => ({
  id: `demo-light-dude-ss-${index}`,
  path_full: LIGHTHeader(`/store_item_assets/steam/apps/3055110/${hash}/ss_${hash}.1920x1080.jpg`),
  path_thumbnail: LIGHTHeader(`/store_item_assets/steam/apps/3055110/${hash}/ss_${hash}.600x338.jpg`),
}));

export const DEMO_GAMES: Game[] = [
  {
    id: "demo-abo-khashem",
    slug: "demo-abo-khashem",
    title: "Abo Khashem",
    title_ar: "أبو خشم",
    short_description:
      "Start your adventure in the City of Torrid! Fight enemies in a whole new way, develop your entrepreneurial skills, explore dangerous dungeons, and discover hidden treasures in this comedic Egyptian RPG.",
    short_description_ar:
      "ابدأ مغامرتك في مدينة توريد! قاتل الأعداء بأسلوب جديد كليًا، وطوّر مهاراتك في التجارة، واستكشف زنازين خطيرة، واكتشف كنوزًا مخفية في لعبة تقمص أدوار مصرية كوميدية.",
    long_description: [
      "<p>Abo Khashem is a comedic role-playing game by Cairo-based Moving Dimensions. After waking up in the middle of nowhere with amnesia, you team up with your trusty lizard companion Shukman to piece together what happened: and uncover a massive conspiracy involving a powerful monolith.</p>",
      "<p>Along the way you purchase properties, hire and manage staff, decorate your homes, gain influence, explore handcrafted dungeons, and customize your own fighting style with a combo builder and talent tree.</p>",
      "<h2>Key features</h2>",
      "<ul><li>Comedic single-player RPG with an open world</li><li>Handcrafted dungeons and unique boss fights</li><li>Custom combo builder, talent trees, and stat progression</li><li>Business simulator: buy property, hire staff, gain influence</li><li>Playable lizard companion and lively NPC dialogue</li><li>Side quests, collectibles, and mini-games</li></ul>",
    ].join(""),
    long_description_ar: [
      "<p>أبو خشم لعبة تقمص أدوار كوميدية من تطوير استوديو Moving Dimensions في القاهرة. تستيقظ في مكان مجهول فاقدًا للذاكرة، فتتعاون مع رفيقك السحلية شكمان لكشف ما حدث: وفضح مؤامرة ضخمة تدور حول مسلّة غامضة ذات قوة هائلة.</p>",
      "<p>خلال رحلتك تشتري العقارات، وتوظّف العاملين وتديرهم، وتزيّن منازلك، وتكسب النفوذ، وتستكشف زنازين مصممة يدويًا، وتصمّم أسلوب قتالك الخاص عبر نظام الكومبو وشجرة المواهب.</p>",
      "<h2>أبرز المزايا</h2>",
      "<ul><li>لعبة تقمص أدوار كوميدية بعالم مفتوح ولاعب واحد</li><li>زنازين مصممة يدويًا ومعارك زعماء فريدة</li><li>نظام كومبو مخصص وشجرة مواهب وتطوير للقدرات</li><li>محاكاة تجارة: اشترِ العقارات ووظّف العاملين واكسب النفوذ</li><li>رفيق سحلية قابل للعب وحوارات طريفة مع الشخصيات</li><li>مهمات جانبية ومقتنيات وألعاب مصغرة</li></ul>",
    ].join(""),
    steam_app_id: "662840",
    steam_url: "https://store.steampowered.com/app/662840/Abo_Khashem/",
    header_image: ABOHeader("/store_item_assets/steam/apps/662840/header.jpg"),
    capsule_image: ABOHeader("/store_item_assets/steam/apps/662840/capsule_616x353.jpg"),
    screenshots: aboScreenshots,
    videos: [],
    tags: ["Single-player", "Open World", "Comedy", "Story Rich", "Controller Support", "Business Sim"],
    genres: ["Action", "Adventure", "Casual", "Indie", "RPG"],
    release_date: "2018-02-22",
    developer_id: "demo-developer",
    developer_name: "Moving Dimensions",
    publisher: "Moving Dimensions",
    status: "approved",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    spotlight_at: null,
    windows_requirements: {
      minimum: "OS: Windows XP SP2+ / Processor: SSE2 instruction set support / Memory: 3 GB RAM / Graphics: DX9 (shader model 3.0) / Storage: 4 GB available space",
      recommended:
        "OS: Windows 7+ / Processor: Core i7 / Memory: 4 GB RAM / Graphics: Nvidia GeForce / DirectX 11 / Storage: 4 GB available space",
    },
    mac_requirements: {
      minimum: "OS: OS X 10.9+ / Processor: SSE2 instruction set support / Memory: 3 GB RAM / Storage: 4 GB available space",
      recommended: "OS: OS X 10.11+ / Memory: 4 GB RAM / Storage: 4 GB available space",
    },
    linux_requirements: null,
    is_free: false,
    price_usd: 29.99,
    metacritic_score: null,
    // Sample figures for layout only: not official Steam ratings.
    rating_count: 132,
    average_rating: 8.4,
    view_count: 1840,
    created_at: "2024-06-10T12:00:00.000Z",
    updated_at: "2024-06-10T12:00:00.000Z",
  },
  {
    id: "demo-knights-of-light-prologue",
    slug: "demo-knights-of-light-prologue",
    title: "Knights of Light: The Prologue",
    title_ar: "فرسان النور: المقدمة",
    short_description:
      "An action-adventure RPG set around the historic 7th-century Battle of al-Qadisiyyah. Play as two elite brothers, lead troops into large battles, and relive history with fast, tactical combat.",
    short_description_ar:
      "لعبة أكشن ومغامرات وتقمص أدوار تدور حول معركة القادسية التاريخية في القرن السابع. العب بأخوين من نخبة الجنود، وقُد القوات في معارك واسعة، وعِش التاريخ بقتال سريع وتكتيكي.",
    long_description: [
      "<p>Knights of Light: The Prologue by Rumbling Games Studio covers the events leading to the great Battle of al-Qadisiyyah in 7th-century Iraq: the decisive clash that brought down the Sassanian Empire. You play as two elite soldiers who also happen to be brothers, thrust into command when the army commander falls ill.</p>",
      "<p>Qaikaa is a heavy hitter who deals massive damage with brute force, while Aassem is quick and agile with swift attacks. Combat switches between single-character action and army control across wide battlefields, with regions to occupy, resources to manage, and fortifications to build.</p>",
      "<h2>Key features</h2>",
      "<ul><li>Two playable characters with distinct combat styles</li><li>Large-scale battles mixing solo combat and troop command</li><li>Historical 7th-century setting with Sassanian art and architecture</li><li>Region conquest, resource management, and fortifications</li><li>Multiple weapons with strengths against different enemies</li></ul>",
    ].join(""),
    long_description_ar: [
      "<p>فرسان النور: المقدمة من تطوير Rumbling Games Studio تروي الأحداث التي سبقت معركة القادسية الكبرى في العراق في القرن السابع: المعركة الحاسمة التي أسقطت الإمبراطورية الساسانية. تلعب بجنديين من النخبة وهما أخوان، يجدان نفسيهما في قيادة الجيش بعد مرض قائده.</p>",
      "<p>قعقاع مقاتل ثقيل يوجه ضربات مدمرة بقوة غاشمة، بينما عاصم سريع ورشيق بهجمات خاطفة. يتنقل القتال بين المواجهات الفردية وقيادة الجيوش في ساحات واسعة، مع مناطق يجب احتلالها وموارد يجب إدارتها وتحصينات يجب بناؤها.</p>",
      "<h2>أبرز المزايا</h2>",
      "<ul><li>شخصيتان قابلتان للعب بأسلوبي قتال مختلفين</li><li>معارك واسعة تمزج القتال الفردي بقيادة القوات</li><li>حقبة تاريخية من القرن السابع بفن وعمارة ساسانية</li><li>احتلال المناطق وإدارة الموارد وبناء التحصينات</li><li>أسلحة متعددة تتفوق على أنواع مختلفة من الأعداء</li></ul>",
    ].join(""),
    steam_app_id: "1159700",
    steam_url: "https://store.steampowered.com/app/1159700/Knights_of_Light_The_Prologue/",
    header_image: KNIGHTSHeader("/store_item_assets/steam/apps/1159700/header.jpg"),
    capsule_image: KNIGHTSHeader("/store_item_assets/steam/apps/1159700/capsule_616x353.jpg"),
    screenshots: knightsScreenshots,
    videos: [],
    tags: ["Single-player", "Historical", "War", "Story Rich", "Tactical", "Third-Person"],
    genres: ["Action", "Adventure", "RPG"],
    release_date: "2020-02-29",
    developer_id: "demo-developer",
    developer_name: "Rumbling Games Studio",
    publisher: "Rumbling Games Studio",
    status: "approved",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    spotlight_at: null,
    windows_requirements: {
      minimum: "OS: Windows 7 / Processor: Intel Core i5 3570K / Memory: 8 GB RAM / Graphics: GTX 770 with 2 GB VRAM / Storage: 30 GB available space",
      recommended: "OS: Windows 10 64-bit / Processor: Intel Core i7 / Memory: 16 GB RAM / Graphics: GTX 1060 / Storage: 30 GB available space",
    },
    mac_requirements: null,
    linux_requirements: null,
    is_free: false,
    price_usd: 24.99,
    metacritic_score: null,
    // Sample figures for layout only: not official Steam ratings.
    rating_count: 97,
    average_rating: 8.9,
    view_count: 1275,
    created_at: "2024-06-11T12:00:00.000Z",
    updated_at: "2024-06-11T12:00:00.000Z",
  },
  {
    id: "demo-light-dude",
    slug: "demo-light-dude",
    title: "Light Dude",
    title_ar: "لايت دود",
    short_description:
      "The level hides when you move in this skill-based action game. Scan the level, step into the dark, dodge deadly threats, and defeat brutal bosses to reclaim the stolen sun. Demo out now!",
    short_description_ar:
      "يختفي المستوى عندما تتحرك في لعبة الأكشن المبنية على المهارة. امسح المرحلة بعينيك ثم ادخل الظلام، وتفادَ الأخطار القاتلة، واهزم الزعماء لاستعادة الشمس المسروقة. الديمو متاح الآن!",
    long_description: [
      "<p>Light Dude by Dergham Games is a skill-based action game with a twist: the moment you move, your vision shrinks and the level hides. Only your memory and reflexes can carry you through the dark.</p>",
      "<p>You carry a limited number of lights per level: move and stop too often and you will run out, left in total darkness. Spend crystals wisely, outmaneuver shadowy enemies, topple brutal bosses, and face Dr. Fog himself to reclaim the stolen sun. Customizable difficulty and a first-person mode make every run your own.</p>",
      "<h2>Key features</h2>",
      "<ul><li>Memory-driven action: the level hides when you move</li><li>Limited lights per level: every step counts</li><li>Unique crystal and gem challenges with hidden treasures</li><li>Brutal bosses and the villainous Dr. Fog</li><li>Customizable difficulty and first-person mode</li><li>Free demo available on Steam</li></ul>",
    ].join(""),
    long_description_ar: [
      "<p>لايت دود من تطوير Dergham Games لعبة أكشن مبنية على المهارة بفكرة مختلفة: لحظة تحركك يتقلص مدى رؤيتك ويختفي المستوى، ولا يبقى لك سوى ذاكرتك وسرعة بديهتك لتعبر الظلام.</p>",
      "<p>تحمل عددًا محدودًا من الأضواء في كل مرحلة: إن تحركت وتوقفت كثيرًا نفدت أضواؤك وبقيت في ظلام دامس. أنفق البلورات بحكمة، وراوغ أعداء الظل، واقهر الزعماء، وواجه دكتور فوغ نفسه لاستعادة الشمس المسروقة. مع صعوبة قابلة للتخصيص ووضع منظور أول، كل جولة بتجربة مختلفة.</p>",
      "<h2>أبرز المزايا</h2>",
      "<ul><li>أكشن يعتمد على الذاكرة: يختفي المستوى عندما تتحرك</li><li>أضواء محدودة في كل مرحلة: كل خطوة محسوبة</li><li>تحديات بلورات وجواهر فريدة بكنوز مخفية</li><li>زعماء أشداء والشرير دكتور فوغ</li><li>صعوبة قابلة للتخصيص ووضع منظور أول</li><li>ديمو مجاني متاح على Steam</li></ul>",
    ].join(""),
    steam_app_id: "3055110",
    steam_url: "https://store.steampowered.com/app/3055110/Light_Dude/",
    header_image: LIGHTHeader(
      "/store_item_assets/steam/apps/3055110/869eff988d7d787919361111019d88ba4817acc4/header.jpg"
    ),
    capsule_image: LIGHTHeader(
      "/store_item_assets/steam/apps/3055110/b5493c45bda728378256c3251ba54eca8f76b221/capsule_231x87.jpg"
    ),
    screenshots: lightDudeScreenshots,
    videos: [],
    tags: ["Single-player", "Puzzle", "Reflex", "Dark", "Boss Fights", "Demo Available"],
    genres: ["Action", "Indie"],
    release_date: null,
    developer_id: "demo-developer",
    developer_name: "Dergham Games",
    publisher: "Dergham Games",
    status: "approved",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    spotlight_at: null,
    windows_requirements: {
      minimum: "OS: Windows 7/8/10/11 (64-bit) / Memory: 2 GB RAM / Storage: 500 MB available space",
      recommended: "OS: Windows 10/11 (64-bit) / Memory: 2 GB RAM / Storage: 500 MB available space",
    },
    mac_requirements: null,
    linux_requirements: null,
    is_free: false,
    price_usd: null,
    metacritic_score: null,
    // Sample figures for layout only: not official Steam ratings.
    rating_count: 0,
    average_rating: 0,
    view_count: 642,
    created_at: "2024-06-12T12:00:00.000Z",
    updated_at: "2024-06-12T12:00:00.000Z",
  },
];

const DEMO_IDS = new Set(DEMO_GAMES.map((game) => game.id));
const DEMO_SLUGS = new Set(DEMO_GAMES.map((game) => game.slug));

/** True for demo listings (by id or slug): never true for real DB rows. */
export function isDemoGame(game: Pick<Game, "id" | "slug"> | string): boolean {
  if (typeof game === "string") return DEMO_IDS.has(game) || DEMO_SLUGS.has(game);
  return DEMO_IDS.has(game.id) || DEMO_SLUGS.has(game.slug);
}

/** Find a demo listing by slug. Real slugs never match. */
export function findDemoGame(slug: string): Game | undefined {
  return DEMO_GAMES.find((game) => game.slug === slug);
}

export interface DemoQuery {
  search?: string;
  genre?: string;
  tag?: string;
  sortBy?: GameFilters["sortBy"];
  sortOrder?: GameFilters["sortOrder"];
  page?: number;
  pageSize?: number;
}

function matchesSearch(game: Game, search: string): boolean {
  const haystack = [
    game.title,
    game.title_ar ?? "",
    game.developer_name,
    game.publisher ?? "",
    game.short_description,
    game.short_description_ar ?? "",
    ...game.genres,
    ...game.tags,
  ]
    .join(" ")
    .toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/**
 * Apply the catalog controls (search, genre, tag, sort, pagination) to the
 * static demo list. Mirrors the server-side catalog semantics: newest first
 * by default, nulls last for ratings/release dates.
 */
export function queryDemoGames(query: DemoQuery): { games: Game[]; count: number } {
  const { search, genre, tag, sortBy = "created_at", sortOrder = "desc", page = 1, pageSize = 20 } = query;

  const filtered = DEMO_GAMES.filter(
    (game) =>
      (!search || matchesSearch(game, search)) &&
      (!genre || game.genres.includes(genre)) &&
      (!tag || game.tags.includes(tag))
  );

  const direction = sortOrder === "asc" ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title) * direction;
      case "average_rating":
        return ((a.average_rating || -1) - (b.average_rating || -1)) * direction;
      case "view_count":
        return (a.view_count - b.view_count) * direction;
      case "release_date": {
        const aTime = a.release_date ? Date.parse(a.release_date) : -1;
        const bTime = b.release_date ? Date.parse(b.release_date) : -1;
        return (aTime - bTime) * direction;
      }
      case "created_at":
      default:
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * direction;
    }
  });

  const safePage = Math.max(1, page);
  return {
    games: sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    count: sorted.length,
  };
}
