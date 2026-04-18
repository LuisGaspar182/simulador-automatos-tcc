/**
 * Interseção da linha origem→destino com a borda do círculo de destino.
 * @param {{ x: number, y: number }} origem
 * @param {{ x: number, y: number }} destino
 * @param {number} raio
 * @returns {{ x: number, y: number }}
 */
export function pontoNaBorda(origem, destino, raio) {
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return destino;
  return {
    x: destino.x - (dx / dist) * raio,
    y: destino.y - (dy / dist) * raio,
  };
}

/**
 * Ponto de controle para curva de Bezier entre dois pontos.
 * Curvatura positiva curva perpendicular-esquerda, negativa curva à direita.
 * @param {{ x: number, y: number }} origem
 * @param {{ x: number, y: number }} destino
 * @param {number} curvatura
 * @returns {{ x: number, y: number }}
 */
export function calcularCurvaBezier(origem, destino, curvatura) {
  const mx = (origem.x + destino.x) / 2;
  const my = (origem.y + destino.y) / 2;
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: mx, y: my };
  // perpendicular normalizado (rotação 90° anti-horária)
  const px = -dy / dist;
  const py = dx / dist;
  return {
    x: mx + px * curvatura,
    y: my + py * curvatura,
  };
}

/**
 * Retorna pontos de cubic bezier para um self-loop acima do nó.
 * Formato: [inicioX, inicioY, cp1X, cp1Y, cp2X, cp2Y, fimX, fimY]
 * @param {{ x: number, y: number }} centro
 * @param {number} raio
 * @returns {number[]}
 */
export function pontosSelfLoop(centro, raio) {
  const { x, y } = centro;
  return [
    x - raio * 0.87, y - raio * 0.5,  // início (borda superior-esquerda)
    x - raio * 2.5,  y - raio * 3.2,  // cp1
    x + raio * 2.5,  y - raio * 3.2,  // cp2
    x + raio * 0.87, y - raio * 0.5,  // fim (borda superior-direita)
  ];
}

/**
 * Verifica se há transição em ambos os sentidos entre dois estados.
 * @param {import('../automata/afd').AFD} afd
 * @param {string} origem
 * @param {string} destino
 * @returns {boolean}
 */
export function ehBidirecional(afd, origem, destino) {
  if (origem === destino) return false;
  const temDireto = Object.values(afd.transicoes[origem] ?? {}).includes(destino);
  const temInverso = Object.values(afd.transicoes[destino] ?? {}).includes(origem);
  return temDireto && temInverso;
}
