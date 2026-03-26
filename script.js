async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const mobs = parseInput(input);

  if (!mobs.length) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  let combinations = [];

  // 🔥 gerar todas combinações
  for (const mob of mobs) {
    const data = await fetchMonsterData(mob.name);
    if (!data) continue;

    const { hp, elements } = data;

    Object.keys(elements).forEach(el => {
      const multiplier = elements[el] / 100;
      const score = hp * mob.count * multiplier;

      combinations.push({
        mob: mob.name,
        element: el,
        score: score
      });
    });
  }

  // 🔥 ordenar pelo maior impacto
  combinations.sort((a, b) => b.score - a.score);

  let usedMobs = new Set();
  let usedElements = new Set();
  let final = [];

  // 🔥 seleção ótima (gananciosa)
  for (const combo of combinations) {
    if (!usedMobs.has(combo.mob) && !usedElements.has(combo.element)) {
      final.push(combo);
      usedMobs.add(combo.mob);
      usedElements.add(combo.element);
    }
  }

  // 🔥 saída
  let output = "🎯 Distribuição ótima de charms\n\n";

  final.forEach(f => {
    output += `🧟 ${f.mob} → ${f.element.toUpperCase()}\n`;
  });

  resultEl.innerText = output;
}
