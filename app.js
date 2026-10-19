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
  let answers = Array(D.questions.length).fill(null);
  let questionIndex = 0;
  let ownResult = null;
  let observerIndex = 7;
  let sharePersona = null;
  let shareMode = "result";
  let toastTimer;
  let posterUrl;
  let posterBusy = false;
  let renderToken = 0;

  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const pad = n => String(n).padStart(2, "0");
  const portrait = (p, className = "character-image") =>
    `<img class="${className}" src="${art[p.id]}" alt="${p.name}表情" width="420" height="390">`;
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
  function collection() {
    return `<section class="collection-section" aria-labelledby="collection-title">
      <div class="section-title-row"><h2 id="collection-title">十种奶娃，十种打开方式</h2>
      <a class="text-action" href="#gallery">翻开人格图鉴${icon("arrow-right")}</a></div>
      <div class="mini-collection">${D.personas.map(p =>
        `<button class="mini-character" data-action="preview" data-id="${p.id}" title="查看${p.name}">${portrait(p, "")}<span>${p.name}</span></button>`
      ).join("")}</div>
    </section>`;
  }
  function observation() {
    const p = D.personas[observerIndex];
    return `<aside class="observatory" aria-label="奶娃人格预览">
      <div class="observe-label">奶娃观察中</div>
      ${portrait(p)}
      <div class="observation-text">
        <div class="character-line">
          ${iconButton("observer-prev", "chevron-left", "上一只奶娃")}
          <h3>${p.name}</h3>
          ${iconButton("observer-next", "chevron-right", "下一只奶娃")}
        </div>
        <p class="character-quote">${p.quote}</p>
        <div class="mode-label"><span></span>NAIWA NO. ${p.code}<span></span></div>
      </div>
    </aside>`;
  }
  function quiz() {
    const q = D.questions[questionIndex];
    const selected = answers[questionIndex];
    const answered = answers.filter(x => x !== null).length;
    return `<div class="page-heading">
      <div><h1>今天，你是哪种奶娃？</h1><p class="page-subtitle">有的奶娃拯救世界，有的奶娃只想躺一会儿。</p></div>
      <div class="test-meta"><span>${icon("list-checks")}20 道生活小事</span><span>${icon("clock-3")}约 3 分钟</span></div>
    </div>
    <div class="quiz-layout">
      <section class="question-section" aria-labelledby="question-title">
        <div class="progress-line"><strong>第 ${pad(questionIndex + 1)} 题<span>/ ${D.questions.length}</span></strong><span>按平常的自己作答</span></div>
        <div class="progress-track" role="progressbar" aria-label="已回答题数" aria-valuemin="0" aria-valuemax="${D.questions.length}" aria-valuenow="${answered}">
          <div class="progress-fill" style="width:${answered / D.questions.length * 100}%"></div>
        </div>
        <form id="quiz-form" class="enter">
          <div class="question-note"><span>${q.note}</span>${iconButton("question-source", "book-open", "查看本题依据")}</div>
          <h2 class="question-title" id="question-title" tabindex="-1">${q.text}</h2>
          <fieldset class="answer-list" aria-labelledby="question-title">
            ${D.options.map((label, value) => `<label class="answer-option${selected === value ? " selected" : ""}">
              <input type="radio" name="answer" value="${value}" ${selected === value ? "checked" : ""} required>
              <span class="answer-letter" aria-hidden="true">${"ABCDE"[value]}</span>
              <span>${label}</span><i class="answer-check" data-lucide="check" aria-hidden="true"></i>
            </label>`).join("")}
          </fieldset>
          <div class="question-actions">
            <button class="back-button" type="button" data-action="previous" ${questionIndex === 0 ? "disabled" : ""}>${icon("arrow-left")}上一题</button>
            <button class="button primary" id="next-button" type="submit" ${selected === null ? "disabled" : ""}>${questionIndex === D.questions.length - 1 ? "领取我的奶娃" : "下一题"}${icon("arrow-right")}</button>
          </div>
        </form>
      </section>
      ${observation()}
    </div>${collection()}`;
  }
  function dimensions(scores) {
    return `<section class="dimensions-section" aria-labelledby="dimensions-title">
      <div class="dimension-intro"><h2 id="dimensions-title">你这次的五维切片</h2><p>仅按本次回答换算，不是人群排名，也没有高低好坏。</p></div>
      <div class="dimensions">${D.dimensions.map(d =>
        `<div class="dimension"><div class="dimension-title"><span>${d.name}</span><strong>${scores[d.id]} / 100</strong></div>
          <div class="dimension-track" role="meter" aria-label="${d.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${scores[d.id]}">
            <div class="dimension-fill" style="width:${scores[d.id]}%;background:${d.color}"></div>
          </div>
          <div class="dimension-poles"><span>${d.low}</span><span>${d.high}</span></div>
        </div>`
      ).join("")}</div>
    </section>`;
  }
  function result(p, preview = false) {
    const personal = !preview && ownResult?.persona.id === p.id;
    const kicker = preview ? "人格图鉴 · 这是一种奶娃，不是一种标准" :
      personal ? "根据你这次的回答，你的奶娃是" : "你收到了一张奶娃人格卡";
    return `<section class="result-layout enter" style="--persona-color:${p.color}">
      <div class="result-header">
        <p class="result-kicker">${kicker}</p>
        <h1 class="result-title"><span class="name-highlight">${p.name}</span></h1>
        <blockquote class="result-quote">“${p.quote}”</blockquote>
        <p class="result-tags">${p.tags.map(tag => `<span>${tag}</span>`).join("")}</p>
        <p class="result-description">${p.description}</p>
        <div class="result-buttons">
          ${personal ? `<button class="button lime" data-action="share" data-id="${p.id}">${icon("share-2")}分享我的奶娃</button>
            <button class="button secondary" data-action="restart">${icon("rotate-ccw")}再测一次</button>` :
            `<button class="button lime" data-action="start">${icon("arrow-right")}我也测一测</button>
            <button class="button secondary" data-action="share" data-id="${p.id}">${icon("share-2")}分享这只奶娃</button>`}
        </div>
        ${personal ? "" : `<p class="shared-note">${preview ? "图鉴预览不代表你的测试结果。" : "这张卡只展示人格类型，不包含答题记录或分数。"}</p>`}
      </div>
      <figure class="result-figure">${portrait(p)}<figcaption><span class="mode-square"></span>${p.mode}<span>NO. ${p.code} / 10</span></figcaption></figure>
    </section>
    <section class="result-notes" aria-label="人格解读">
      <div class="result-note"><h2>${icon("coffee")}你的日常</h2><p>${p.daily}</p></div>
      <div class="result-note"><h2>${icon("sparkles")}你的隐藏技能</h2><p>${p.strength}</p></div>
      <div class="result-note"><h2>${icon("sprout")}给今天的你</h2><p>${p.reminder}</p></div>
    </section>
    ${personal ? dimensions(ownResult.scores) : ""}
    ${collection()}`;
  }
  function gallery() {
    return `<div class="page-heading"><div><h1>奶娃人格图鉴</h1><p class="page-subtitle">没有哪一款更好，只有哪一刻更像你。</p></div>
      <a class="button secondary" href="#test">${icon("arrow-left")}回到测试</a></div>
      <section class="gallery-grid" aria-label="十种奶娃人格">
        ${D.personas.map(p => `<button class="gallery-item" data-action="preview" data-id="${p.id}">
          <span class="item-number">NO. ${p.code}</span>${portrait(p, "")}
          <h2>${p.name}</h2><div class="item-mode"><span class="mode-square" style="--persona-color:${p.color}"></span>${p.mode}</div><p>${p.quote}</p>
        </button>`).join("")}
      </section>`;
  }
  function render() {
    renderToken++;
    if (modal.open) modal.close();
    const current = L.route(location.hash);
    document.querySelector("#gallery-link").setAttribute("aria-current", current.page === "gallery" ? "page" : "false");
    document.title = current.persona ? `${current.persona.name}｜奶娃人格测试` : "奶娃人格测试｜今天，你是哪一只？";
    if (current.page === "test") main.innerHTML = quiz();
    else if (current.page === "gallery") main.innerHTML = gallery();
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
  function about() {
    showModal("关于这场奶娃观察", `<div class="about-content">
      <p>用一只奶娃，表达今天的自己。这是一份趣味人格探索，不是专业心理量表，也不能用来诊断任何心理或精神问题。奶娃表情由创作者原创提供。</p>
      <h3>参考了什么？</h3>
      <p>本版 20 道题逐一参考 Mini-IPIP 的公开英文条目及正反向计分键，改写成中文日常情境。五个维度分别为外向性、宜人性、尽责性、情绪波动与想象思辨；本站用更生活化的名称展示。</p>
      <p>英文原量表有发表研究，但本站的中文情境改写、作答标签和奶娃匹配未经过信效度验证，不能继承原量表的可靠性数字。不将它称为标准中文版 Mini-IPIP、BFI-2 或 MBTI。</p>
      <ul>
        <li>${D.research.citation} <a href="${D.research.paper}" target="_blank" rel="noopener noreferrer">论文 DOI</a></li>
        <li><a href="${D.research.key}" target="_blank" rel="noopener noreferrer">Mini-IPIP 官方条目与计分键</a>：逐题改写的直接依据。</li>
        <li><a href="${D.research.permission}" target="_blank" rel="noopener noreferrer">IPIP 公开使用说明</a>：条目、量表可供商业或非商业使用。</li>
      </ul>
      <p>官方说明区分词汇学大五与更广泛的五因素模型，第五维度在此指 Intellect / Imagination，不是智商测验，也不能代表开放性的所有方面。</p>
      <details class="source-details"><summary>20 道题的来源对应</summary>
        <ol class="source-list">${D.questions.map(q => `<li><strong>${D.dimensions.find(d => d.id === q.dimension).name} · ${q.reverse ? "反向" : "正向"}</strong><p lang="en">${q.sourceItem}</p><p>${q.text}</p></li>`).join("")}</ol>
      </details>
      <h3>分数意味着什么？</h3>
      <p>每个维度由 4 道题组成，包含正向和反向题，等权换算至 0–100。系统用等权距离寻找与本次回答最接近的虚构奶娃原型；十种原型由本站创作，不是研究发现的人格类别。结果不代表稳定的人格分类，分数也不是人群百分位。</p>
      <p>“愤怒”“忧郁”等模式名称来自表情包，仅是角色语气，不是临床判断。</p>
      <h3>答案会去哪里？</h3>
      <p>答案仅留在当前页面内存中，不上传、不写入本地存储；刷新或关闭页面后清空。分享链接只包含奶娃类型，不包含答案和维度分数。链接可以被转发，分享前请确认你愿意公开这种人格描述。</p>
      <p>本网站不设置登录、广告或访问统计。托管与网络服务商仍可能产生常规访问日志，请勿在链接中添加个人信息。</p>
    </div>`);
  }
  function questionSource() {
    const q = D.questions[questionIndex];
    const d = D.dimensions.find(item => item.id === q.dimension);
    showModal("本题的科学参考", `<div class="about-content">
      <p class="source-question">第 ${pad(q.id)} 题 · ${q.text}</p>
      <h3>${d.name} · ${q.reverse ? "反向计分" : "正向计分"}</h3>
      <p>参考 Mini-IPIP 公开条目：</p><blockquote class="source-original" lang="en">${q.sourceItem}</blockquote>
      <p>${q.rationale}</p>
      <p>这是中文情境改写，不是经验证的等值翻译。仅作趣味自我探索，不用于心理诊断。</p>
      <p><a href="${D.research.key}" target="_blank" rel="noopener noreferrer">查看官方条目与计分键</a> · <a href="${D.research.paper}" target="_blank" rel="noopener noreferrer">查看研究论文</a></p>
    </div>`);
  }
  function share(id, mode = "result") {
    sharePersona = D.personas.find(p => p.id === id);
    if (!sharePersona) return;
    shareMode = mode;
    const p = sharePersona;
    const inWechat = /MicroMessenger/i.test(navigator.userAgent);
    const local = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    showModal("把这只奶娃递给朋友", `<div class="share-preview">${portrait(p, "")}<div><h3>${p.name}</h3><p>${p.quote}</p></div></div>
      <div class="share-tabs" role="group" aria-label="分享内容">
        <button data-action="share-result" aria-pressed="${mode === "result"}">这张人格卡</button>
        <button data-action="share-entry" aria-pressed="${mode === "entry"}">测试入口</button>
      </div>
      <div class="share-url-row"><input id="share-url" type="text" readonly aria-label="分享链接">${iconButton("copy", "copy", "复制链接")}</div>
      <p class="share-caption">${mode === "result" ? "朋友会看到这款奶娃的介绍，也可以开始自己的测试。" : "朋友会从第 1 题开始，不会看到你的人格类型。"}</p>
      ${inWechat ? '<p class="wechat-note">微信内可使用右上角菜单分享；也可以复制链接或保存人格卡。</p>' : ""}
      ${local ? '<p class="wechat-note">当前是本地预览，链接仅在本机可用。公开发布后才能发给朋友。</p>' : ""}
      <div class="share-buttons">
        <button class="button primary" data-action="native-share">${icon("share-2")}分享链接</button>
        <button class="button secondary" data-action="poster">${icon("image-down")}生成人格卡</button>
      </div>`);
    document.querySelector("#share-url").value = L.shareUrl(location.href, mode === "result" ? p.id : null);
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
    const url = L.shareUrl(location.href, shareMode === "result" ? sharePersona.id : null);
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({
        title: shareMode === "result" ? `${sharePersona.name}｜奶娃人格测试` : "今天，你是哪种奶娃？",
        text: shareMode === "result" ? `${sharePersona.quote} 你也来找找自己的奶娃。` : "20 道生活小事，找到你的奶娃人格。",
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
    const url = L.shareUrl(location.href, mode === "result" ? p.id : null);
    const image = new Image();
    try {
      image.src = art[p.id];
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1210;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 900, 1210);
      ctx.fillStyle = "#c9f45b";
      ctx.fillRect(0, 0, 900, 14);
      ctx.fillStyle = "#20231f";
      ctx.font = '600 26px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText("奶娃人格测试", 60, 82);
      ctx.font = '20px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = "#8a927e";
      ctx.textAlign = "right";
      ctx.fillText(`NO. ${p.code} / 10`, 840, 82);
      ctx.textAlign = "left";
      ctx.fillStyle = "#20231f";
      ctx.font = '800 72px "Microsoft YaHei", "PingFang SC", sans-serif';
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
      ctx.fillText(mode === "result" ? "扫码看看这只，也找找你那只。" : "扫码开始你的 20 道生活小事。", 64, 1052);
      ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText("原创趣味探索，非专业心理量表或诊断。", 64, 1156);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        result => result ? resolve(result) : reject(new Error("Image export failed")), "image/png"));
      if (token !== renderToken || !modal.open) return;
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(blob);
      showModal("你的奶娃人格卡", `<img class="poster-image" src="${posterUrl}" alt="${p.name}分享卡，带${mode === "result" ? "人格结果" : "测试入口"}二维码">
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
    ownResult = null;
    navigate("#test");
  }
  document.addEventListener("change", event => {
    if (event.target.matches('input[name="answer"]')) {
      const value = Number(event.target.value);
      if (!Number.isInteger(value) || value < 0 || value > 4) return;
      answers[questionIndex] = value;
      document.querySelectorAll(".answer-option").forEach(label => {
        label.classList.toggle("selected", label.querySelector("input").checked);
      });
      document.querySelector("#next-button").disabled = false;
      const progress = document.querySelector('[role="progressbar"]');
      const answered = answers.filter(x => x !== null).length;
      progress?.setAttribute("aria-valuenow", String(answered));
      const fill = document.querySelector(".progress-fill");
      if (fill) fill.style.width = `${answered / D.questions.length * 100}%`;
    }
  });
  document.addEventListener("submit", event => {
    if (event.target.id !== "quiz-form") return;
    event.preventDefault();
    if (answers[questionIndex] === null) return;
    if (questionIndex < D.questions.length - 1) {
      questionIndex++;
      observerIndex = Math.floor(questionIndex / 2) % D.personas.length;
      render();
      document.querySelector("#question-title").focus({ preventScroll: true });
    } else {
      try {
        const scores = L.score(answers);
        const persona = L.match(scores);
        ownResult = { scores, persona };
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
    if (action === "previous" && questionIndex > 0) { questionIndex--; render(); }
    if (action === "observer-prev" || action === "observer-next") {
      observerIndex = (observerIndex + (action === "observer-next" ? 1 : -1) + D.personas.length) % D.personas.length;
      const holder = document.querySelector(".observatory");
      if (holder) { holder.outerHTML = observation(); icons(); }
    }
    if (action === "share") share(element.dataset.id);
    if (action === "share-result") share(sharePersona.id, "result");
    if (action === "share-entry") share(sharePersona.id, "entry");
    if (action === "return-share") share(sharePersona.id, shareMode);
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
