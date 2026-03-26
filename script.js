async function fetchWeakness(monsterName) {
  const pageName = monsterName
    .trim()
    .replace(/ /g, "_")
    .replace(/__+/g, "_");

  const apiUrl = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&format=json&origin=*`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (!data.parse) return null;

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

  if (Object.keys(values).length === 0) return null;

  const weakness = Object.keys(values).reduce((a, b) =>
    values[a] > values[b] ? a : b
  );

  return { weakness, value: values[weakness] };
}


// 🔥 PARSE DO INPUT
function parseInput(text) {
  const lines = text.split("\n");
  const mobs = [];

  lines.forEach(line => {
    const match = line.match(/(\d+)x\s+(.+)/i);
    if (match) {
      mobs.push({
        count: parseInt(match[1]),
        name: match[2].toLowerCase()
      });
    }
  });

  return mobs;
}


// 🔥 FUNÇÃO PRINCIPAL
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

    if (!data) continue;

    results.push({
      name: mob.name,
      percent: percent.toFixed(2),
      weakness: data.weakness,
      value: data.value
    });

    // soma ponderada
    if (!elementScore[data.weakness]) {
      elementScore[data.weakness] = 0;
    }

    elementScore[data.weakness] += percent;
  }

  // melhor elemento da hunt
  const bestElement = Object.keys(elementScore).reduce((a, b) =>
    elementScore[a] > elementScore[b] ? a : b
  );

  // 🖨️ OUTPUT
  let output = "📊 Resultado da Hunt\n\n";

  results.forEach(r => {
    output += `🧟 ${r.name} (${r.percent}%) → ${r.weakness} (${r.value}%)\n`;
  });

  output += `\n🔥 Melhor elemento geral: ${bestElement}\n`;

  resultEl.innerText = output;
}
