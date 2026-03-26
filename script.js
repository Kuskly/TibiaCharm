async function analyze() {
  const name = document.getElementById("monster").value.trim();
  const resultEl = document.getElementById("result");

  if (!name) {
    resultEl.innerText = "Digite o nome do monstro.";
    return;
  }

  const url = `https://tibia.fandom.com/wiki/${name.replace(/ /g, "_")}`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxy);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let values = {};

    // 🔍 Procura TODAS as tabelas
    const tables = doc.querySelectorAll("table");

    tables.forEach(table => {
      const rows = table.querySelectorAll("tr");

      rows.forEach(row => {
        const cells = row.querySelectorAll("td, th");

        if (cells.length >= 2) {
          const key = cells[0].innerText.trim();
          const value = cells[1].innerText.trim();

          const match = value.match(/(\d+)%/);

          if (match) {
            values[key] = parseInt(match[1]);
          }
        }
      });
    });

    // 🔥 Filtra só elementos relevantes
    const validElements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];

    let filtered = {};

    validElements.forEach(el => {
      if (values[el] !== undefined) {
        filtered[el] = values[el];
      }
    });

    if (Object.keys(filtered).length === 0) {
      resultEl.innerText = "Não encontrou dados de fraqueza.";
      return;
    }

    const weakness = Object.keys(filtered).reduce((a, b) =>
      filtered[a] > filtered[b] ? a : b
    );

    resultEl.innerText =
      `📊 ${name}\n\n` +
      `🔥 Maior fraqueza: ${weakness} (${filtered[weakness]}%)\n\n` +
      JSON.stringify(filtered, null, 2);

  } catch (err) {
    resultEl.innerText = "Erro: " + err.message;
  }
}
