(() => {
  "use strict";
  const D = globalThis.NaiwaData;
  const L = globalThis.NaiwaLogic;
  const art = globalThis.NaiwaArt;
  const main = document.querySelector("#main");
  const modal = document.querySelector("#modal");
  const content = document.querySelector("#modal-content");
  const toastElement = document.querySelector("#toast");
  const modalStatus = document.querySelector("#modal-status");
  if (location.protocol !== "file:") document.documentElement.classList.add("web-font");
  let answers = Array(D.questions.length).fill(null);
  let questionIndex = 0;
  let followupPlan = null;
  let supplemental = {};
  let galleryMode = "personas";
  let ownResult = null;
  let observerIndex = 7;
  let sharePersona = null;
  let shareKind = "result";
  let shareMode = "result";
  let toastTimer;
  let posterUrl;
  let posterBusy = false;
  let renderToken = 0;

  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const pad = n => String(n).padStart(2, "0");
  const portrait = (p, className = "character-image") =>
    `<img class="${className}" src="${art[p.artId || p.id]}" alt="${p.name}，保留原图文字" width="420" height="390">`;
  const iconButton = (action, name, label) =>
    `<button type="button" class="icon-button" data-action="${action}" aria-label="${label}" title="${label}">${icon(name)}</button>`;

  function icons() {
    globalThis.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  }
  function toast(message) {
    clearTimeout(toastTimer);
    const inModal = modal.open;
    toastElement.textContent = message;
    toastElement.hidden = inModal;
    modalStatus.textContent = message;
    modalStatus.hidden = !inModal;
    toastTimer = setTimeout(() => {
      toastElement.hidden = true;
      modalStatus.hidden = true;
    }, 3500);
  }
  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function activeQuestions() { return [...D.questions, ...(followupPlan || [])]; }
  function currentQuestion() { return activeQuestions()[questionIndex]; }
  function answerFor(q) { return q.supplemental ? supplemental[q.id] ?? null : answers[q.id - 1]; }
  function stateCollection() {
    return `<section class="state-section" aria-labelledby="state-title">
      <div class="section-title-row"><h2 id="state-title">人格先放放，今天切什么模式？</h2><span class="section-aside">十二种自选状态</span></div>
      <div class="state-strip">${D.states.map(s => `<button class="state-item" data-action="state" data-id="${s.id}">
        ${portrait(s, "")}<h3>${s.name}</h3></button>`).join("")}</div>
      <p class="state-footnote">人格是一般倾向，状态随情境变化。这一页不替你的心情下结论。</p>
    </section>`;
  }
  function collection() {
    return `<section class="collection-section" aria-labelledby="collection-title">
      <div class="section-title-row"><h2 id="collection-title">奶娃到齐，各有各的抽象</h2>
      <a class="text-action" href="#gallery">翻开人格图鉴${icon("arrow-right")}</a></div>
      <div class="mini-collection">${D.personas.map(p =>
        `<button class="mini-character" data-action="preview" data-id="${p.id}" title="查看${p.name}">${portrait(p, "")}<span>${p.name}</span></button>`
      ).join("")}</div>
    </section>`;
  }
  function observation() {
    const p = D.personas[observerIndex];
    const value = answerFor(currentQuestion());
    const reactions = ["收到，这段剧情不是你的主场。", "收到，偶尔客串一下。", "说不准也行，奶娃不替你拍板。", "收到，这个片段有点眼熟。", "懂了，本人的生活片段，实名出演。"];
    return `<aside class="observatory${value === null ? "" : " is-reacting"}" aria-label="陪答奶娃，不代表测试结果">
      <div class="observe-label">你的陪答奶娃</div>
      ${portrait(p)}
      <div class="observation-text">
        <div class="character-line">
          ${iconButton("observer-prev", "chevron-left", "上一只奶娃")}
          <h3>${p.name}</h3>
          ${iconButton("observer-next", "chevron-right", "下一只奶娃")}
        </div>
        <p class="character-quote" aria-live="polite">${value === null ? p.quote : reactions[value]}</p>
        <div class="mode-label"><span></span>NAIWA NO. ${p.code}<span></span></div>
      </div>
    </aside>`;
  }
  function quiz() {
    const q = currentQuestion();
    const selected = answerFor(q);
    const total = activeQuestions().length;
    const answered = answers.filter(x => x !== null).length + Object.keys(supplemental).length;
    return `<div class="page-heading">
      <div><h1>你是哪种奶娃？</h1><p class="page-subtitle">有人切战斗模式，有人还在开机缓冲。</p></div>
      ${portrait(D.personas[observerIndex], "mobile-sticker")}
      <div class="test-meta"><span>${icon("list-checks")}20 题 + 按需补问</span><span>${icon("clock-3")}约 3–5 分钟</span></div>
    </div>
    <div class="quiz-layout">
      <section class="question-section" aria-labelledby="question-title">
        <div class="progress-line"><strong>${q.supplemental ? "补充" : "生活片段"} ${pad(q.supplemental ? questionIndex - 19 : questionIndex + 1)}<span>/ ${q.supplemental ? followupPlan.length : 20}</span></strong><span>想想近几个月通常的自己</span></div>
        <div class="progress-track" role="progressbar" aria-label="已回答题数" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${answered}">
          <div class="progress-fill" style="width:${answered / total * 100}%"></div>
        </div>
        <form id="quiz-form" class="enter">
          <div class="question-note"><span>${q.note}</span>${iconButton("question-source", "book-open", "查看本题依据")}</div>
          ${q.supplemental ? `<p class="branch-note">${icon("git-branch")}${q.reason}</p>` : ""}
          <div class="question-copy">
            <h2 class="question-title" id="question-title" tabindex="-1">${q.text}</h2>
            <p class="question-aside"><span>奶娃画外音</span>${q.aside}</p>
          </div>
          <fieldset class="answer-list" aria-labelledby="question-title">
            ${D.options.map((label, value) => `<label class="answer-option${selected === value ? " selected" : ""}">
              <input type="radio" name="answer" value="${value}" ${selected === value ? "checked" : ""} required>
              <span class="answer-letter" aria-hidden="true"></span>
              <span>${label}</span><i class="answer-check" data-lucide="check" aria-hidden="true"></i>
            </label>`).join("")}
          </fieldset>
          <div class="question-actions">
            <button class="back-button" type="button" data-action="previous" ${questionIndex === 0 ? "disabled" : ""}>${icon("arrow-left")}上一题</button>
            <button class="button primary" id="next-button" type="submit" ${selected === null ? "disabled" : ""}>${questionIndex === 19 && followupPlan === null ? "继续" : questionIndex === total - 1 ? "揭晓我的奶娃" : "下一题"}${icon("arrow-right")}</button>
          </div>
        </form>
      </section>
      ${observation()}
    </div>${collection()}`;
  }
  function dimensions(scores) {
    return `<section class="dimensions-section" aria-labelledby="dimensions-title">
      <div class="dimension-intro"><h2 id="dimensions-title">这次回答里的五种倾向</h2><p>不是人群排名，也没有高低好坏。</p></div>
      <div class="dimensions">${D.dimensions.map(d =>
        `<div class="dimension"><div class="dimension-title"><span>${d.name}</span><strong>${scores[d.id]} / 100</strong></div>
          <div class="dimension-track" role="meter" aria-label="${d.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${scores[d.id]}">
            <div class="dimension-fill" style="width:${scores[d.id]}%;background:${d.color}"></div>
          </div>
          <div class="dimension-poles"><span>${d.low}</span><span>${d.high}</span></div>
        </div>`
      ).join("")}</div>
      <p class="score-note">本次完成 20 道基础题${ownResult.extraCount ? `与 ${ownResult.extraCount} 道补充题，补充了${ownResult.extraDimensions.join("、")}的情境` : "，未触发补问"}。分数是作答换算，不是准确率。中文改写与补问规则尚未经过信效度验证。</p>
      <button class="text-action" data-action="about">题目依据与计分说明${icon("arrow-up-right")}</button>
    </section>`;
  }
  function result(p, preview = false) {
    const personal = !preview && ownResult?.persona.id === p.id;
    const kicker = preview ? "人格图鉴 · 看看这只的设定" :
      personal ? "本次回答匹配到的奶娃，已就位" : "朋友递来一只奶娃，请查收";
    return `<section class="result-layout enter" style="--persona-color:${p.color}">
      <div class="result-header">
        <p class="result-kicker">${kicker}</p>
        <h1 class="result-title"><span class="name-highlight">${p.name}</span></h1>
        <blockquote class="result-quote">“${p.quote}”</blockquote>
        <p class="result-tags">${p.tags.map(tag => `<span>${tag}</span>`).join("")}</p>
        <div class="result-buttons">
          ${personal ? `<button class="button lime" data-action="share" data-id="${p.id}">${icon("share-2")}分享我的奶娃</button>
            <button class="button secondary" data-action="restart">${icon("rotate-ccw")}再测一次</button>` :
            `<button class="button lime" data-action="start">${icon("arrow-right")}我也测一测</button>
            <button class="button secondary" data-action="share" data-id="${p.id}">${icon("share-2")}分享这只奶娃</button>`}
        </div>
        <p class="result-description">${p.description}</p>
        <p class="result-fiction">角色设定供你玩梗，不是科学人格分类，也不概括你的全部。</p>
        ${personal ? "" : `<p class="shared-note">${preview ? "图鉴预览不代表你的测试结果。" : "这张卡只展示人格类型，不包含答题记录或分数。"}</p>`}
      </div>
      <figure class="result-figure">${portrait(p)}<figcaption><span class="mode-square"></span>${p.mode}<span>NO. ${p.code} / 10</span></figcaption></figure>
    </section>
    <section class="result-notes" aria-label="奶娃小剧场，以下为娱乐角色文案">
      <div class="result-note"><h2>${icon("clapperboard")}日常名场面</h2><p>${p.daily}</p></div>
      <div class="result-note"><h2>${icon("message-circle")}内心弹幕</h2><p>“${p.monologue}”</p></div>
      <div class="result-note"><h2>${icon("sprout")}友情提示</h2><p>${p.reminder}</p></div>
    </section>
    ${personal ? dimensions(ownResult.scores) : ""}
    ${stateCollection()}
    ${collection()}`;
  }
  function statePage(s) {
    const source = D.personas.find(p => p.id === s.artId);
    return `<section class="state-detail enter">
      <div class="state-detail-title"><p class="state-label">今日状态 · ${s.code} / 12</p><h1>${s.name}</h1>
        <blockquote>“${s.quote}”</blockquote></div>
      <figure class="state-figure">${portrait(s)}<figcaption>原图：${source.mode}</figcaption></figure>
      <div class="state-detail-copy"><p>${s.description}</p><p class="state-disclaimer">这是一张自选状态卡，不是人格测评结果，也不参与计分。</p>
      <div class="result-buttons"><button class="button primary" data-action="share-state" data-id="${s.id}">${icon("share-2")}分享这份状态</button>
        <a class="button secondary" href="#test">${icon("arrow-right")}测测我的人格</a></div></div>
    </section>${stateCollection()}`;
  }
  function gallery() {
    const isState = galleryMode === "states";
    return `<div class="page-heading"><div><h1>奶娃图鉴</h1><p class="page-subtitle">有的已经起飞，有的还在加载。都不是你的全部。</p></div>
      <a class="button secondary" href="#test">${icon("arrow-left")}回到测试</a></div>
      <div class="gallery-tabs" role="group" aria-label="图鉴分类">
        <button data-action="gallery-personas" aria-pressed="${!isState}">人格 / 10</button>
        <button data-action="gallery-states" aria-pressed="${isState}">今日状态 / 12</button>
      </div>
      ${isState ? '<p class="gallery-caption">同一只奶娃，也可以过不一样的一天。状态卡由你自己选择。</p>' : ""}
      <section class="gallery-grid" aria-label="${isState ? "十二种日常状态" : "十种奶娃人格"}">
        ${(isState ? D.states : D.personas).map(p => `<button class="gallery-item" data-action="${isState ? "state" : "preview"}" data-id="${p.id}">
          <span class="item-number">NO. ${p.code}</span>${portrait(p, "")}
          <h2>${p.name}</h2>${isState ? "" : `<div class="item-mode"><span class="mode-square" style="--persona-color:${p.color}"></span>${p.mode}</div>`}<p>${p.quote}</p>
        </button>`).join("")}
      </section>`;
  }
  function render() {
    renderToken++;
    if (modal.open) modal.close();
    const current = L.route(location.hash);
    document.querySelector("#gallery-link").setAttribute("aria-current", current.page === "gallery" ? "page" : "false");
    document.title = current.persona || current.card ? `${(current.persona || current.card).name}｜奶娃人格测试` : "奶娃人格测试｜你是哪一只？";
    if (current.page === "test") main.innerHTML = quiz();
    else if (current.page === "gallery") main.innerHTML = gallery();
    else if (current.page === "state") main.innerHTML = statePage(current.card);
    else if (current.page === "result" || current.page === "persona") main.innerHTML = result(current.persona, current.page === "persona");
    else main.innerHTML = `<section class="empty-state">${portrait(D.personas[1])}<h1>这张人格卡，漂去虚空了。</h1>
      <p>链接可能不完整，或者不是这个版本的奶娃。<br>重新测一次，找回今天的自己。</p><a class="button lime" href="#test">${icon("arrow-right")}去测一测</a></section>`;
    icons();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function showModal(title, html) {
    renderToken++;
    document.querySelector("#modal-title").textContent = title;
    content.innerHTML = html;
    modalStatus.hidden = true;
    icons();
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
  }
  function paperList(recent) {
    return `<ul class="research-list">${D.papers.filter(p => (p.category === "recent") === recent).map(p =>
      `<li><strong>${p.author}</strong><p lang="en">${p.title}</p><p>${p.use}</p>
        ${p.scope ? `<p class="reading-scope">${p.scope}</p>` : ""}
        <a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer">论文 DOI${icon("arrow-up-right")}</a></li>`).join("")}</ul>`;
  }
  function about() {
    showModal("关于这场奶娃观察", `<div class="about-content">
      <p>玩梗归玩梗，人格不盖章。这是参考人格研究条目的趣味自我探索，不是专业心理量表，不能诊断任何心理或精神问题。</p>
      <h3>参考了什么？</h3>
      <p>20 道基础题逐一参考 Mini-IPIP 的公开英文条目及正反向计分键；10 道备用补问来自 IPIP 更宽的条目集，每次最多使用 6 道。五个维度分别为外向性、宜人性、尽责性、情绪波动与想象思辨。</p>
      <p>英文原量表有发表研究，但本站的中文情境改写、作答标签和奶娃匹配未经过信效度验证，不能继承原量表的可靠性数字。不将它称为标准中文版 Mini-IPIP、BFI-2 或 MBTI。</p>
      <details class="research-details" open><summary>近年研究提醒 · 2025–2026</summary>
        <p>这三篇用于约束措辞和解释，不是新增题目来源，更不证明奶娃分类或补问更准确。</p>
        ${paperList(true)}
      </details>
      <details class="research-details"><summary>基础研究与直接条目来源</summary>
        ${paperList(false)}
        <ul>
        <li><a href="${D.research.key}" target="_blank" rel="noopener noreferrer">Mini-IPIP 官方条目与计分键</a>：逐题改写的直接依据。</li>
        <li><a href="${D.research.broadKey}" target="_blank" rel="noopener noreferrer">IPIP Big-Five 官方条目集</a>：补充情境题的直接依据。</li>
        <li><a href="${D.research.permission}" target="_blank" rel="noopener noreferrer">IPIP 公开使用说明</a>：条目、量表可供商业或非商业使用。</li>
        </ul>
      </details>
      <p>官方说明区分词汇学大五与更广泛的五因素模型，第五维度在此指 Intellect / Imagination，不是智商测验，也不能代表开放性的所有方面。</p>
      <p>核对日期：2026 年 10 月 19 日。基础研究核对书目信息与摘要；三篇近年研究另核对出版社正文的摘要、方法与讨论。不是系统综述，不表示这些是全部最新研究或原作者为本站背书。</p>
      <details class="source-details"><summary>全部 30 道题的来源对应</summary>
        <ol class="source-list">${[...D.questions, ...D.followups].map(q => `<li><strong>${q.supplemental ? "备用补问 · " : ""}${D.dimensions.find(d => d.id === q.dimension).name} · ${q.reverse ? "反向" : "正向"}</strong><p lang="en">${q.sourceItem}</p><p>${q.text}</p><p>${q.rationale}</p></li>`).join("")}</ol>
      </details>
      <h3>分支为什么出现？</h3>
      <p>完成基础题后，若某维度有至少 2 个中间回答，或反向校正后的最高与最低回答相差至少 3 档，就列入补问候选。按“中间回答数 × 2 + 档位差”排序，最多取 3 个维度，每个补 2 题；同分按社交、共情、条理、情绪、想象的顺序。</p>
      <p>这些阈值是本站设计规则，不是论文给出的临床或统计界限。情境差异不等于回答不诚实。补问提供更多自述信息，但尚未证明会提高准确性；它不是经过题库标定的自适应测验。</p>
      <p>返回修改任何基础题后，已有补问及其答案会清空，基础题完成后重新选分支，避免旧分支混入新结果。</p>
      <h3>分数意味着什么？</h3>
      <p>每个维度有 4 道基础题，被补问的维度有 6 题。正向取 0–4，反向取 4 减原值，按本维度实际题数等权平均后换算为 0–100。五个维度在奶娃匹配中仍等权，不因题数更多而加权。</p>
      <p>系统用距离寻找最接近的虚构原型；十种原型由本站设计，不是研究发现的人格类别。“名场面”和“内心弹幕”都是角色小剧场，不是从题目推导出的经历、读心或能力判断。结果不是固定身份，分数不是人群百分位。今日状态另外自选，不改变人格结果。</p>
      <p>“愤怒”“忧郁”等模式名称来自表情包，仅是角色语气，不是临床判断。</p>
      <h3>答案会去哪里？</h3>
      <p>答案仅留在当前页面内存中，不上传、不写入本地存储；刷新或关闭页面后清空。分享链接只包含奶娃类型，不包含答案和维度分数。链接可以被转发，分享前请确认你愿意公开这种人格描述。</p>
      <p>本网站不设置登录、广告或访问统计。托管与网络服务商仍可能产生常规访问日志，请勿在链接中添加个人信息。</p>
      <h3>图像与字体</h3>
      <p>十幅表情由用户声明原创并提供，保留原图文字与主体；十二种状态复用这些素材，不冒充新增插画。未再发布无明确授权的网络表情。展示字体使用本地子集化的霞鹜文楷屏幕阅读版，遵循 SIL OFL 1.1。</p>
      <h3>梗从哪里来？</h3>
      <p>文风参考中文网络二创里的“切换模式”“开机缓冲”“脑内弹幕”等抽象表达，本站文案重新编写。题干保留行为、频率和方向，画外音不计分。不了解梗也可以按题干作答。</p>
      <p>这不是奶龙官方产品，与相关 IP 官方无合作或背书。没有搬用其动画、配音、音乐或新增网络表情；文风灵感不是心理学证据。</p>
    </div>`);
  }
  function questionSource() {
    const q = currentQuestion();
    const d = D.dimensions.find(item => item.id === q.dimension);
    showModal("本题的科学参考", `<div class="about-content">
      <p class="source-question">${q.supplemental ? "补充情境" : `第 ${pad(q.id)} 题`} · ${q.text}</p>
      <h3>${d.name} · ${q.reverse ? "反向计分" : "正向计分"}</h3>
      <p>参考 ${q.supplemental ? "IPIP Big-Five 官方条目集" : "Mini-IPIP 公开条目"}：</p><blockquote class="source-original" lang="en">${q.sourceItem}</blockquote>
      <p>${q.rationale}</p>
      <p>这是中文情境改写，不是经验证的等值翻译。仅作趣味自我探索，不用于心理诊断。</p>
      <p><a href="${q.supplemental ? D.research.broadKey : D.research.key}" target="_blank" rel="noopener noreferrer">查看官方条目与计分键</a> · <a href="${D.research.paper}" target="_blank" rel="noopener noreferrer">查看基础题研究论文</a></p>
    </div>`);
  }
  function share(id, mode = "result", kind = "result") {
    sharePersona = (kind === "state" ? D.states : D.personas).find(p => p.id === id);
    if (!sharePersona) return;
    shareMode = mode;
    shareKind = kind;
    const p = sharePersona;
    const inWechat = /MicroMessenger/i.test(navigator.userAgent);
    const local = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    showModal("把这只奶娃递给朋友", `<div class="share-preview">${portrait(p, "")}<div><h3>${p.name}</h3><p>${p.quote}</p></div></div>
      <div class="share-tabs" role="group" aria-label="分享内容">
        <button data-action="share-result" aria-pressed="${mode === "result"}">这张${kind === "state" ? "状态" : "人格"}卡</button>
        <button data-action="share-entry" aria-pressed="${mode === "entry"}">测试入口</button>
      </div>
      <div class="share-url-row"><input id="share-url" type="text" readonly aria-label="分享链接">${iconButton("copy", "copy", "复制链接")}</div>
      <p class="share-caption">${mode === "result" ? `朋友会看到这张${kind === "state" ? "自选状态" : "人格"}卡，也可以开始自己的测试。` : "朋友会从第 1 题开始，不会看到你的人格类型或状态。"}</p>
      ${inWechat ? '<p class="wechat-note">微信内可使用右上角菜单分享；也可以复制链接或保存人格卡。</p>' : ""}
      ${local ? '<p class="wechat-note">当前是本地预览，链接仅在本机可用。公开发布后才能发给朋友。</p>' : ""}
      <div class="share-buttons">
        <button class="button primary" data-action="native-share">${icon("share-2")}分享链接</button>
        <button class="button secondary" data-action="poster">${icon("image-down")}生成${kind === "state" ? "状态" : "人格"}卡</button>
      </div>`);
    document.querySelector("#share-url").value = L.shareUrl(location.href, mode === "result" ? p.id : null, kind);
  }
  async function copyLink() {
    const input = document.querySelector("#share-url");
    if (!input) return false;
    const text = input.value;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        input.focus();
        input.select();
        if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
      }
      toast("链接已复制，可以发给朋友了。");
      return true;
    } catch {
      input.focus();
      input.select();
      toast("请长按或选中上方链接，手动复制。");
      return false;
    }
  }
  async function nativeShare() {
    if (!sharePersona) return;
    const url = L.shareUrl(location.href, shareMode === "result" ? sharePersona.id : null, shareKind);
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({
        title: shareMode === "result" ? `${sharePersona.name}｜奶娃人格测试` : "今天，你是哪种奶娃？",
        text: shareMode === "result" ? `${sharePersona.quote} 你也来找找自己的奶娃。` : "20 道基础题与按需补问，找到你的奶娃人格。",
        url,
      });
    } catch (error) {
      if (error.name !== "AbortError") await copyLink();
    }
  }
  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    let line = "";
    for (const char of text) {
      if (ctx.measureText(line + char).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = char;
      } else line += char;
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }
  async function poster() {
    if (posterBusy || !sharePersona) return;
    posterBusy = true;
    const p = sharePersona;
    const token = renderToken;
    const mode = shareMode;
    const kind = shareKind;
    const url = L.shareUrl(location.href, mode === "result" ? p.id : null, kind);
    const image = new Image();
    try {
      image.src = art[p.artId || p.id];
      await image.decode();
      if (document.fonts && location.protocol !== "file:") {
        await document.fonts.load('32px "Naiwa WenKai"').catch(() => []);
      }
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1210;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 900, 1210);
      ctx.fillStyle = "#f46656";
      ctx.fillRect(0, 0, 900, 14);
      ctx.fillStyle = "#20231f";
      ctx.font = '600 26px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText("奶娃人格测试", 60, 82);
      ctx.font = '20px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = "#8a927e";
      ctx.textAlign = "right";
      ctx.fillText(`${kind === "state" ? "今日状态" : "人格图鉴"} ${p.code} / ${kind === "state" ? 12 : 10}`, 840, 82);
      ctx.textAlign = "left";
      ctx.fillStyle = "#20231f";
      ctx.font = location.protocol === "file:" ? '72px "STKaiti", serif' : '72px "Naiwa WenKai", "PingFang SC", sans-serif';
      ctx.fillText(p.name, 60, 205);
      ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
      drawWrapped(ctx, `“${p.quote}”`, 64, 265, 760, 44);
      ctx.drawImage(image, 165, 315, 570, 529);
      ctx.font = '24px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = "#68735c";
      ctx.fillText(p.tags.join("  /  "), 64, 886);
      ctx.fillStyle = "#edf1e7";
      ctx.fillRect(60, 925, 780, 2);
      if (typeof globalThis.qrcode !== "function") throw new Error("QR library unavailable");
      const qr = globalThis.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      const modules = qr.getModuleCount();
      const step = Math.floor(160 / (modules + 8));
      const qrSize = (modules + 8) * step;
      const left = 840 - qrSize;
      const top = 962;
      ctx.fillStyle = "white";
      ctx.fillRect(left, top, qrSize, qrSize);
      ctx.fillStyle = "#20231f";
      for (let r = 0; r < modules; r++) {
        for (let c = 0; c < modules; c++) {
          if (qr.isDark(r, c)) ctx.fillRect(left + (c + 4) * step, top + (r + 4) * step, step, step);
        }
      }
      ctx.font = '600 29px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText("你是哪种奶娃？", 64, 1005);
      ctx.font = '23px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = "#79836d";
      ctx.fillText(mode === "result" ? "扫码看看这只，也找找你那只。" : "扫码开始测试，还有按需补问。", 64, 1052);
      ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText(kind === "state" ? "自选日常状态，不是测评或心理诊断。" : "趣味探索，非专业心理量表或诊断。", 64, 1156);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        result => result ? resolve(result) : reject(new Error("Image export failed")), "image/png"));
      if (token !== renderToken || !modal.open) return;
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(blob);
      showModal(`你的奶娃${kind === "state" ? "状态" : "人格"}卡`, `<img class="poster-image" src="${posterUrl}" alt="${p.name}分享卡，带${mode === "result" ? "卡片" : "测试入口"}二维码">
        <p class="share-caption">保存后可发送给朋友；手机也可长按图片保存。图片不包含答案和维度分数。</p>
        <div class="poster-actions"><a class="button primary" href="${posterUrl}" download="naiwa-${p.id}.png">${icon("download")}保存图片</a>
        <button class="button secondary" data-action="return-share">${icon("arrow-left")}返回分享</button></div>`);
    } catch {
      toast("图片生成暂时没有成功，你仍可以复制链接分享。");
    } finally { posterBusy = false; }
  }
  function restart() {
    if (!confirm("重新开始这次测试？当前页面中的答案和结果会清空。")) return;
    answers = Array(D.questions.length).fill(null);
    questionIndex = 0;
    followupPlan = null;
    supplemental = {};
    ownResult = null;
    navigate("#test");
  }
  document.addEventListener("change", event => {
    if (event.target.matches('input[name="answer"]')) {
      const value = Number(event.target.value);
      if (!Number.isInteger(value) || value < 0 || value > 4) return;
      const q = currentQuestion();
      if (q.supplemental) supplemental[q.id] = value;
      else {
        if (answers[questionIndex] !== value && followupPlan !== null) {
          followupPlan = null;
          supplemental = {};
          toast("基础回答已修改，补问会在基础题完成后重新选择。");
        }
        answers[questionIndex] = value;
      }
      ownResult = null;
      document.querySelectorAll(".answer-option").forEach(label => {
        label.classList.toggle("selected", label.querySelector("input").checked);
      });
      document.querySelector("#next-button").disabled = false;
      document.querySelector("#next-button").innerHTML = `${questionIndex === 19 && followupPlan === null ? "继续" :
        questionIndex === activeQuestions().length - 1 ? "揭晓我的奶娃" : "下一题"}${icon("arrow-right")}`;
      const progress = document.querySelector('[role="progressbar"]');
      const answered = answers.filter(x => x !== null).length + Object.keys(supplemental).length;
      progress?.setAttribute("aria-valuemax", String(activeQuestions().length));
      progress?.setAttribute("aria-valuenow", String(answered));
      const fill = document.querySelector(".progress-fill");
      if (fill) fill.style.width = `${answered / activeQuestions().length * 100}%`;
      const holder = document.querySelector(".observatory");
      if (holder) { holder.outerHTML = observation(); icons(); }
      const mobile = document.querySelector(".mobile-sticker");
      if (mobile) mobile.outerHTML = portrait(D.personas[observerIndex], "mobile-sticker is-reacting");
    }
  });
  document.addEventListener("submit", event => {
    if (event.target.id !== "quiz-form") return;
    event.preventDefault();
    if (answerFor(currentQuestion()) === null) return;
    if (questionIndex === 19 && followupPlan === null) followupPlan = L.branchPlan(answers);
    if (questionIndex < activeQuestions().length - 1) {
      questionIndex++;
      observerIndex = Math.floor(questionIndex / 2) % D.personas.length;
      render();
      document.querySelector("#question-title").focus({ preventScroll: true });
    } else {
      try {
        const scores = L.score(answers, supplemental);
        const persona = L.match(scores);
        ownResult = { scores, persona, extraCount: followupPlan.length,
          extraDimensions: D.dimensions.filter(d => followupPlan.some(q => q.dimension === d.id)).map(d => d.name) };
        navigate(`#result/${D.version}/${persona.id}`);
      } catch (error) { toast(error.message); }
    }
  });
  document.addEventListener("click", event => {
    const element = event.target.closest("[data-action]");
    if (!element || element.disabled) return;
    const action = element.dataset.action;
    if (action === "about") about();
    if (action === "question-source") questionSource();
    if (action === "close") modal.close();
    if (action === "preview") navigate(`#persona/${D.version}/${element.dataset.id}`);
    if (action === "state") navigate(`#state/${D.version}/${element.dataset.id}`);
    if (action === "gallery-personas" || action === "gallery-states") {
      galleryMode = action === "gallery-states" ? "states" : "personas";
      render();
    }
    if (action === "previous" && questionIndex > 0) { questionIndex--; render(); }
    if (action === "observer-prev" || action === "observer-next") {
      observerIndex = (observerIndex + (action === "observer-next" ? 1 : -1) + D.personas.length) % D.personas.length;
      const holder = document.querySelector(".observatory");
      if (holder) { holder.outerHTML = observation(); icons(); }
      const mobile = document.querySelector(".mobile-sticker");
      if (mobile) mobile.outerHTML = portrait(D.personas[observerIndex], "mobile-sticker");
    }
    if (action === "share") share(element.dataset.id);
    if (action === "share-state") share(element.dataset.id, "result", "state");
    if (action === "share-result") share(sharePersona.id, "result", shareKind);
    if (action === "share-entry") share(sharePersona.id, "entry", shareKind);
    if (action === "return-share") share(sharePersona.id, shareMode, shareKind);
    if (action === "copy") void copyLink();
    if (action === "native-share") void nativeShare();
    if (action === "poster") void poster();
    if (action === "restart") restart();
    if (action === "start") {
      if (ownResult || answers.some(a => a !== null)) restart();
      else navigate("#test");
    }
  });
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
    }
  });
  modal.addEventListener("close", () => { renderToken++; });
  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    main.focus();
  });
  window.addEventListener("hashchange", render);
  render();
})();
