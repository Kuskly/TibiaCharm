console.log("SCRIPT CARREGADO");

// UI
function handleCharmChange() {
  const type = document.getElementById("charmType").value;
  const input = document.getElementById("charmValue");

  if (!type) {
    input.style.display = "none";
    return;
  }

  input.style.display = "block";
  input.placeholder = type === "overflux" ? "Digite sua mana" : "Digite sua vida";
}


// Parse
function parseInput(text) {
  return text.split("\n")
    .map(l => l.match(/(\d+)x\s+(.+)/i))
    .filter(Boolean)
    .map(m => ({
      count: parseInt(m[1]),
      name: m[2].trim()
    }));
}


// API
async function searchMonster(name) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  return data.query.search.length ? data.query.search[0].title : null;
}

async function fetchWikiText(title) {
  const url = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=wikitext&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  return data.parse ? data.parse.wikitext["*"] : null;
}


// Extrair dados
function extractData(wikiText) {
  const elements = ["physical","earth","fire","death","energy","holy","ice","drown"];
  const values = {};

  elements.forEach(el => {
    const m = wikiText.match(new RegExp(`${el}DmgMod\\s*=\\s*(\\d+)%`, "i"));
    if (m) values[el] = parseInt(m[1]);
  });

  const hp = parseInt((wikiText.match(/hp\s*=\s*(\d+)/i) || [])[1]);

  if (!hp || !Object.keys(values).length) return null;

  return { hp, elements: values };
}


async function fetchMonsterData(name) {
  const correct = await searchMonster(name);
  if (!correct) return null;

  const wikiText = await fetchWikiText(correct);
  if (!wikiText) return null;

  return extractData(wikiText);
}


// 🚀 ANALYZE FINAL CORRETO
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const charmType = document.getElementById("charmType").value;
  const charmValue = parseFloat(document.getElementById("charmValue").value);

  resultEl.innerText = "🔄 Analisando...";

  const mobs = parseInput(input);
  if (!mobs.length) return resultEl.innerText = "Nenhum mob.";

  let mobDataList = [];

  for (const mob of mobs) {
    const data = await fetchMonsterData(mob.name);
    if (!data) continue;

    mobDataList.push({
      name: mob.name,
      count: mob.count,
      hp: data.hp,
      elements: data.elements
    });
  }

  // 🔥 melhor elemento por mob
  let base = mobDataList.map(m => {
    let bestEl = null;
    let bestDmg = 0;

    Object.entries(m.elements).forEach(([el, mod]) => {
      const dmg = m.hp * 0.05 * (mod / 100);
      if (dmg > bestDmg) {
        bestDmg = dmg;
        bestEl = el;
      }
    });

    return {
      mob: m.name,
      count: m.count,
      element: bestEl,
      damage: bestDmg
    };
  });

  // 🔥 média da hunt
  const totalKills = mobs.reduce((a,b)=>a+b.count,0);

  let valorMedio = 0;

  base.forEach(b => {
    const percent = b.count / totalKills;
    valorMedio += percent * b.damage;
  });

  // 🔥 charm
  let charmDamage = 0;
  if (charmType === "overflux") charmDamage = charmValue / 40;
  if (charmType === "overpower") charmDamage = charmValue / 20;

  // 🔥 decisão correta
  if (charmType && charmValue && charmDamage > valorMedio) {

    // pega o MELHOR mob da hunt
    let bestIndex = -1;
    let bestImpact = -1;

    base.forEach((b,i) => {
      const percent = b.count / totalKills;
      const impact = percent * b.damage;

      if (impact > bestImpact) {
        bestImpact = impact;
        bestIndex = i;
      }
    });

    // substitui
    base[bestIndex] = {
      mob: base[bestIndex].mob,
      count: base[bestIndex].count,
      element: charmType.toUpperCase(),
      damage: charmDamage
    };
  }

  // saída
  let output = "🎯 Distribuição ótima\n\n";

  base.forEach(b => {
    output += `🧟 ${b.mob} → ${b.element.toUpperCase()}\n`;
  });

  output += `\n📊 Média: ${valorMedio.toFixed(2)}`;

  if (charmType) {
    output += `\n⚡ ${charmType.toUpperCase()}: ${charmDamage.toFixed(2)}`;
  }

  resultEl.innerText = output;
}
