globalThis.NaiwaLogic = (() => {
  const data = globalThis.NaiwaData;
  function validate(answers) {
    if (!Array.isArray(answers) || answers.length !== data.questions.length ||
        answers.some(value => !Number.isInteger(value) || value < 0 || value > 4) ||
        Array.from(answers).some(value => value === undefined)) {
      throw new Error("请先完成全部题目。");
    }
  }
  function branchPlan(answers) {
    validate(answers);
    const priorities = data.dimensions.map((dimension, order) => {
      const items = data.questions.map((question, index) => ({ question, value: answers[index] }))
        .filter(item => item.question.dimension === dimension.id);
      const midpoints = items.filter(item => item.value === 2).length;
      const corrected = items.map(item => item.question.reverse ? 4 - item.value : item.value);
      const spread = Math.max(...corrected) - Math.min(...corrected);
      return { dimension: dimension.id, order, midpoints, spread,
        priority: midpoints * 2 + spread,
        reason: midpoints >= 2 ? "这个维度有较多中间回答，再看看另一个日常场景。" :
          "这个维度在不同场景下的回答有些差异，再补充一个角度。" };
    }).filter(item => item.midpoints >= 2 || item.spread >= 3)
      .sort((a, b) => b.priority - a.priority || a.order - b.order).slice(0, 3);
    // This is a fixed heuristic, not a calibrated adaptive-test estimator.
    return priorities.flatMap(item => data.followups.filter(q => q.dimension === item.dimension)
      .map(q => ({ ...q, reason: item.reason })));
  }
  function score(answers, supplemental) {
    validate(answers);
    const planned = supplemental === undefined ? [] : branchPlan(answers);
    if (supplemental !== undefined && (!supplemental || Array.isArray(supplemental) ||
        Object.keys(supplemental).length !== planned.length ||
        planned.some(q => !Object.prototype.hasOwnProperty.call(supplemental, q.id) ||
          !Number.isInteger(supplemental[q.id]) || supplemental[q.id] < 0 || supplemental[q.id] > 4) ||
        Object.keys(supplemental).some(id => !planned.some(q => q.id === id)))) {
      throw new Error("请先完成本次补充题目。");
    }
    const totals = Object.fromEntries(data.dimensions.map(d => [d.id, 0]));
    const counts = { ...totals };
    data.questions.forEach((question, index) => {
      totals[question.dimension] += question.reverse ? 4 - answers[index] : answers[index];
      counts[question.dimension] += 1;
    });
    planned.forEach(question => {
      const value = supplemental[question.id];
      totals[question.dimension] += question.reverse ? 4 - value : value;
      counts[question.dimension] += 1;
    });
    return Object.fromEntries(data.dimensions.map(d =>
      [d.id, Math.round(totals[d.id] / (counts[d.id] * 4) * 100)]));
  }
  function match(scores) {
    if (!scores || data.dimensions.some(d =>
      !Number.isFinite(scores[d.id]) || scores[d.id] < 0 || scores[d.id] > 100)) {
      throw new Error("人格维度无效。");
    }
    // Equal-weight nearest fictional prototype; stable list order resolves ties.
    return data.personas.reduce((best, persona) => {
      const distance = data.dimensions.reduce((sum, d) =>
        sum + (scores[d.id] - persona.prototype[d.id]) ** 2, 0);
      return distance < best.distance ? { persona, distance } : best;
    }, { persona: null, distance: Infinity }).persona;
  }
  function route(hash) {
    if (!hash || hash === "#" || hash === "#test") return { page: "test" };
    if (hash === "#gallery") return { page: "gallery" };
    // V1 links remain type-only cards; never reconstruct old private scores.
    const state = /^#state\/v3\/([a-z]+)$/.exec(hash);
    if (state) {
      const card = data.states.find(item => item.id === state[1]);
      if (card) return { page: "state", card };
    }
    const result = /^#(result|persona)\/v[123]\/([a-z]+)$/.exec(hash);
    if (result) {
      const persona = data.personas.find(p => p.id === result[2]);
      if (persona) return { page: result[1], persona };
    }
    return { page: "invalid" };
  }
  function shareUrl(base, personaId, kind = "result") {
    const url = new URL(base);
    url.search = "";
    if (!["result", "state"].includes(kind) ||
        (personaId && !(kind === "state" ? data.states : data.personas).some(p => p.id === personaId))) {
      throw new Error("无效的人格类型。");
    }
    url.hash = personaId ? `${kind}/${data.version}/${personaId}` : "test";
    return url.href;
  }
  return Object.freeze({ score, branchPlan, match, route, shareUrl });
})();
