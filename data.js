// 水溶液あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、札幌市教育委員会の学習課題・岡山県と仙台市立作並小学校の学習指導案・福島県の授業改善資料（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、実験の結果を読んで、水溶液（塩酸・炭酸水・食塩水・石灰水・アンモニア水）を選ぶ。正解したら2段目「何性？」を選ぶ。
// 気体の性質は「気体あて」で扱う。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    sap25: ["札幌市教育委員会 小学6年理科 学習課題「水溶液の性質とはたらき」（1）", "https://www.city.sapporo.jp/kyoiku/shido/documents/1_6_4_25.pdf"],
    sap26: ["札幌市教育委員会 小学6年理科 学習課題「水溶液の性質とはたらき」（2）", "https://www.city.sapporo.jp/kyoiku/shido/documents/1_6_4_26.pdf"],
    okayama: ["岡山県 第6学年 理科学習指導案「水溶液の性質」", "https://www.pref.okayama.jp/uploaded/life/330543_1527326_misc.pdf"],
    sendai: ["仙台市立作並小学校 理科学習指導案「水よう液の性質とはたらき」", "https://www.sendai-c.ed.jp/~shorika/2016/ato/ato_h25/h25_6nen_2gatsu_sidouan.pdf"],
    fcs: ["福島県教育センター 授業改善の工夫「水溶液の性質」", "https://center.fcs.ed.jp/file/2235"],
  };

  // 答えになる5つ
  const CLASSES = ["塩酸", "炭酸水", "食塩水", "石灰水", "アンモニア水"];

  // 2段目「何性？」の3つ（札幌市の学習課題・岡山県の学習指導案）
  const GROUPS = {
    sansei: { name: "酸性", sub: "青色のリトマス紙を赤くする" },
    chusei: { name: "中性", sub: "どちらの色のリトマス紙も変えない" },
    arukari: { name: "アルカリ性", sub: "赤色のリトマス紙を青くする" },
  };
  // 何がとけている（「なぜ」に出す。岡山県・仙台市の学習指導案）
  const CATS = { kitai: "気体がとけている", kotai: "固体がとけている" };
  // 答えごとの決まり。2段目・とけているもの・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "塩酸": { grp: "sansei", cat: "kitai", key: "塩酸は、塩化水素という気体がとけた酸性の水溶液です。蒸発させても何も残りません。" },
    "炭酸水": { grp: "sansei", cat: "kitai", key: "炭酸水は、二酸化炭素がとけた酸性の水溶液です。あわが出ていて、蒸発させても何も残りません。" },
    "食塩水": { grp: "chusei", cat: "kotai", key: "食塩水は、食塩がとけた中性の水溶液です。蒸発させると食塩が出てきます。" },
    "石灰水": { grp: "arukari", cat: "kotai", key: "石灰水は、石灰がとけたアルカリ性の水溶液です。蒸発させると白い物が残ります。" },
    "アンモニア水": { grp: "arukari", cat: "kitai", key: "アンモニア水は、アンモニアという気体がとけたアルカリ性の水溶液です。つんとしたにおいがします。" },
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["理科の実験で。", "プリントの問題。", "実験ノートより。", "テスト勉強で。", "理科の授業で。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どの水溶液？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("e_nioi", 0, "塩酸", "においのある酸性", ["okayama"], "においと、リトマス紙の色に注目しましょう。",
      "岡山県の学習指導案では、塩酸はにおいがあり、蒸発させても何も残らず、青色のリトマス紙を赤色に変えます。",
      ["においがあり、蒸発させても何も残らず、青色のリトマス紙を赤くする水溶液。"]),
    K("t_awa", 0, "炭酸水", "あわが出ている", ["sendai", "okayama"], "見た目に注目しましょう。",
      "仙台市立作並小学校の学習指導案では、透明だがあわがある水溶液を「あわが出ているから炭酸水」と考えます。",
      ["透明だが、あわが出ている水溶液。"]),
    K("s_chusei", 0, "食塩水", "リトマス紙が変わらない", ["okayama"], "どちらのリトマス紙も変わりません。",
      "岡山県の学習指導案では、食塩水はリトマス紙の色を変化させませんでした。どちらも変えないのは中性の水溶液です。",
      ["赤色のリトマス紙も青色のリトマス紙も、色を変えない水溶液。"]),
    K("k_nigoru", 0, "石灰水", "二酸化炭素で白くにごる", ["okayama", "sap26"], "二酸化炭素を調べるのに使います。",
      "岡山県の学習指導案や札幌市の学習課題では、二酸化炭素を石灰水に通して、白くにごるかを調べます。",
      ["二酸化炭素を通すと、白くにごる水溶液。"]),
    K("a_tsun", 0, "アンモニア水", "つんとしたにおい", ["sendai", "okayama"], "においとリトマス紙に注目しましょう。",
      "仙台市立作並小学校の学習指導案ではつんとしたにおいがし、岡山県の学習指導案では赤色のリトマス紙を青色に変えます。",
      ["つんとしたにおいがして、赤色のリトマス紙を青くする水溶液。"]),
    // ---- ふつう ----
    K("e_enka", 1, "塩酸", "塩化水素がとけている", ["okayama"], "とけているのは気体です。",
      "岡山県の学習指導案では、塩酸には塩化水素という気体が溶けていることを知らせます。",
      ["塩化水素という気体がとけている水溶液。"]),
    K("t_senko", 1, "炭酸水", "線香の火が消える", ["okayama", "sap25"], "出てくるあわは二酸化炭素です。",
      "岡山県の学習指導案では、炭酸水から出る気体を集めて線香の火を入れると、すぐに消えました。札幌市の学習課題でも炭酸水から出るあわを集めて調べます。",
      ["出てくるあわを集めた試験管に、火のついた線香を入れると、すぐに消える水溶液。"]),
    K("s_tokasanai", 1, "食塩水", "金属をとかさない", ["okayama"], "中性の水溶液です。",
      "岡山県の学習指導案では、中性の水溶液は鉄もアルミニウムも溶かしません。",
      ["中性で、鉄もアルミニウムもとかさない水溶液。"]),
    K("k_shiroi", 1, "石灰水", "白い物が残るアルカリ性", ["sendai", "okayama"], "蒸発させたあとに注目しましょう。",
      "仙台市立作並小学校の学習指導案では、石灰水は透明でにおいがなく、蒸発すると白い物が残ります。岡山県の学習指導案では赤色のリトマス紙を青色に変えます。",
      ["においがなく、蒸発させると白い物が残り、赤色のリトマス紙を青くする水溶液。"]),
    K("a_kitai", 1, "アンモニア水", "気体がとけたアルカリ性", ["okayama"], "とけているのは気体です。",
      "岡山県の学習指導案では、アンモニア水にはアンモニアという気体が溶けていて、赤色のリトマス紙を青色に変えます。",
      ["気体がとけている、アルカリ性の水溶液。"]),
    // ---- むずかしい ----
    K("e_kanki", 2, "塩酸", "蒸発させるときは換気", ["okayama"], "金属に加えると熱やあわが出ます。",
      "岡山県の学習指導案では、金属に塩酸を加えると熱や泡を出して溶けます。水分を蒸発させるときは塩化水素が出るので、換気を十分におこないます。",
      ["金属を熱やあわを出してとかし、蒸発させるときは気体が出るので換気が必要な水溶液。"]),
    K("t_muishu", 2, "炭酸水", "においのない酸性", ["okayama"], "においがない酸性の水溶液です。",
      "岡山県の学習指導案では、炭酸水はにおいがなく、蒸発させても何も残らず、青色のリトマス紙を赤色に変えます。",
      ["においはなく、蒸発させても何も残らないが、青色のリトマス紙を赤くする水溶液。"]),
    K("s_kessho", 2, "食塩水", "結晶が出てくる", ["sendai", "okayama"], "とけていたものが出てきます。",
      "仙台市立作並小学校の学習指導案では、蒸発させると結晶が出てきて「食塩が出てきたから食塩水」と考えます。",
      ["においがなく、蒸発させると結晶が出てきて、リトマス紙の色を変えない水溶液。"]),
    K("k_alumi", 2, "石灰水", "アルミニウムだけとかす", ["okayama", "sendai"], "においのないアルカリ性です。",
      "岡山県の学習指導案では、石灰水は鉄を溶かさず、アルミニウムを溶かします。仙台市の学習指導案では、においはありません。",
      ["アルカリ性で、アルミニウムはとかすが鉄はとかさず、においのない水溶液。"]),
    K("a_nokoranai", 2, "アンモニア水", "何も残らないアルカリ性", ["sendai", "okayama"], "とけているのは気体です。",
      "アンモニア水は蒸発させても何も残りません（仙台市の学習指導案）。赤色のリトマス紙を青色に変えます（岡山県の学習指導案）。",
      ["蒸発させても何も残らないのに、赤色のリトマス紙を青くする水溶液。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "e_nioi|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit 2026-11-17）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const SYA = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = SYA; else root.SYA = SYA;
})(typeof self !== "undefined" ? self : this);
