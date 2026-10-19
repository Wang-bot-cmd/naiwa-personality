globalThis.NaiwaLogic = (() => {
  const data = globalThis.NaiwaData;
  function score(answers) {
    if (!Array.isArray(answers) || answers.length !== data.questions.length ||
        answers.some(value => !Number.isInteger(value) || value < 0 || value > 4) ||
        Array.from(answers).some(value => value === undefined)) {
      throw new Error("请先完成全部题目。");
    }
    const totals = Object.fromEntries(data.dimensions.map(d => [d.id, 0]));
    const counts = { ...totals };
    data.questions.forEach((question, index) => {
      totals[question.dimension] += question.reverse ? 4 - answers[index] : answers[index];
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
    const result = /^#(result|persona)\/v[12]\/([a-z]+)$/.exec(hash);
    if (result) {
      const persona = data.personas.find(p => p.id === result[2]);
      if (persona) return { page: result[1], persona };
    }
    return { page: "invalid" };
  }
  function shareUrl(base, personaId) {
    const url = new URL(base);
    url.search = "";
    if (personaId && !data.personas.some(p => p.id === personaId)) {
      throw new Error("无效的人格类型。");
    }
    url.hash = personaId ? `result/${data.version}/${personaId}` : "test";
    return url.href;
  }
  return Object.freeze({ score, match, route, shareUrl });
})();
