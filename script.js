// 🔥 Busca fraqueza no Fandom (CORRIGIDO)
async function fetchWeakness(monsterName) {
  const pageName = monsterName
    .trim()
    .replace(/^a\s+/i, "")
    .replace(/\b\w/g, c => c.toUpperCase()) // 🔥 Capitaliza
    .replace(/ /g, "_")
    .replace(/__+/g, "_");

  const apiUrl = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&format=json&origin=*`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log("🔎 Buscando:", pageName);

    if (!data.parse) {
      console.log("❌ Página não encontrada:", pageName);
      return null;
    }

    const html = data.parse.text["*"];
    const doc = new DOMParser().parseFromString(html, "text/html");

    const elements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];
    const values = {};

    const lines = doc.body.textContent.split("\n");

    lines.forEach(line => {
      elements.forEach(el => {
        if (line.toLowerCase().includes(el.toLowerCase())) {
          const match = line.match(/(\d+)%/);
          if (match) {
            values[el] = parseInt(match[1]);
          }
        }
      });
    });

    if (Object.keys(values).length === 0) {
      console.log("⚠️ Sem fraqueza encontrada:", pageName);
      return null;
    }

    const weakness = Object.keys(values).reduce((a, b) =>
      values[a] > values[b] ? a : b
    );

    return { weakness, value: values[weakness] };

  } catch (err) {
    console.log("🔥 Erro ao buscar:", pageName, err);
    return null;
  }
}


// 🔍 Parse do input da hunt
function parseInput(text) {
  const lines = text.split("\n");
  const mobs = [];

  lines.forEach(line => {
    const match = line.match(/(\d+)x\s+(.+)/i);
    if (match) {
      mobs.push({
        count: parseInt(match[1]),
        name: match[2].trim() // 🔥 NÃO usa lowercase
      });
    }
  });

  return mobs;
}


// 🚀 Função principal
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const mobs = parseInput(input);

  if (mobs.length === 0) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  const total = mobs.reduce((sum, m) => sum + m.count, 0);

  let results = [];
  let elementScore = {};

  for (const mob of mobs) {
    const percent = (mob.count / total) * 100;

    const data = await fetchWeakness(mob.name);

    console.log("Mob:", mob.name, "Data:", data);

    if (!data) continue;

    results.push({
      name: mob.name,
      percent: percent.toFixed(2),
      weakness: data.weakness,
      value: data.value
    });

    if (!elementScore[data.weakness]) {
      elementScore[data.weakness] = 0;
    }

    elementScore[data.weakness] += percent;
  }

  const keys = Object.keys(elementScore);

  // 🛑 proteção total
  if (keys.length === 0) {
    resultEl.innerText =
      "❌ Nenhuma fraqueza encontrada.\n\n" +
      "Verifique:\n" +
      "- Nome dos mobs\n" +
      "- Se existem no Fandom\n\n" +
      "Abra o console (F12) para ver detalhes.";

    console.log("elementScore vazio:", elementScore);
    return;
  }

  // ✅ reduce seguro
  const bestElement = keys.reduce((a, b) =>
    elementScore[a] > elementScore[b] ? a : b,
    keys[0]
  );

  // 🖨️ OUTPUT
  let output = "📊 Resultado da Hunt\n\n";

  results.forEach(r => {
    output += `🧟 ${r.name} (${r.percent}%) → ${r.weakness} (${r.value}%)\n`;
  });

  output += `\n🔥 Melhor elemento geral: ${bestElement}\n`;

  resultEl.innerText = output;
}
