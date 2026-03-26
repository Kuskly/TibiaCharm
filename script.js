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

    const text = doc.body.innerText;

    const elements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];
    let values = {};

    elements.forEach(el => {
      const regex = new RegExp(el + ".*?(\\d+)%", "i");
      const match = text.match(regex);
      if (match) {
        values[el] = parseInt(match[1]);
      }
    });

    if (Object.keys(values).length === 0) {
      resultEl.innerText = "Não foi possível encontrar dados.";
      return;
    }

    const weakness = Object.keys(values).reduce((a, b) =>
      values[a] > values[b] ? a : b
    );

    resultEl.innerText =
      `📊 Resultado para ${name}\n\n` +
      `🔥 Maior fraqueza: ${weakness} (${values[weakness]}%)\n\n` +
      JSON.stringify(values, null, 2);

  } catch (err) {
    resultEl.innerText = "Erro: " + err.message;
  }
}
