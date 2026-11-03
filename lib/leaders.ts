/**
 * Геометрия выноски «как на чертеже»: стойка от горизонтальной грани карточки,
 * полка по горизонтали и скос под 45° до контура лампы. Общая для первого
 * экрана и блока «Мы слышим риск раньше», чтобы оба выглядели одинаково.
 */

export type Box = { left: number; top: number; right: number; bottom: number };

export type Lamp = {
  /** центр свечения в координатах контейнера */
  cx: number;
  cy: number;
  /** полуоси габарита, за который линия не заходит */
  a: number;
  b: number;
};

export type Leader = {
  /** путь ломаной */
  d: string;
  /** точка на контуре лампы */
  dotX: number;
  dotY: number;
  /** выход из карточки — начало градиента */
  x0: number;
  y0: number;
};

export function elbowLeader(card: Box, lamp: Lamp, stub: number): Leader | null {
  const midX = (card.left + card.right) / 2;

  // стойка выходит из той грани, что смотрит на лампу
  const down = lamp.cy > (card.top + card.bottom) / 2;
  const y0 = down ? card.bottom : card.top;
  const y1 = y0 + (down ? stub : -stub);

  const dx = midX - lamp.cx;
  const dy = y1 - lamp.cy;
  const norm = Math.sqrt((dx / lamp.a) ** 2 + (dy / lamp.b) ** 2);
  // карточка внутри габарита лампы — выноску рисовать некуда
  if (!Number.isFinite(norm) || norm < 1.08) return null;

  const t = 1 / norm;
  const tx = lamp.cx + dx * t;
  const ty = lamp.cy + dy * t;

  const runX = tx - midX;
  const runY = ty - y1;
  const diag = Math.min(Math.abs(runX), Math.abs(runY));
  const kneeX = tx - Math.sign(runX) * diag;

  return {
    d: `M ${midX} ${y0} L ${midX} ${y1} L ${kneeX} ${y1} L ${tx} ${ty}`,
    dotX: tx,
    dotY: ty,
    x0: midX,
    y0,
  };
}

/** Где лежит картинка лампы в координатах контейнера. */
export type LampBox = { left: number; top: number; width: number; height: number };

/**
 * Контур лампы: по доле высоты (0–1) возвращает долю ширины, на которой
 * силуэт начинается (side = -1, левый край) или кончается (side = 1, правый).
 */
export type Edge = (yFrac: number, side: -1 | 1) => number;

/**
 * Та же выноска, но последний скос упирается не в условный эллипс, а в
 * реальный силуэт лампы: точка ложится ровно на край плафона или корпуса.
 * diag — длина скоса под 45°; если полка при этом ушла бы назад, скос
 * укорачиваем.
 */
export function silhouetteLeader(
  card: Box,
  lamp: LampBox,
  edge: Edge,
  stub: number,
  diag: number
): Leader | null {
  const midX = (card.left + card.right) / 2;
  const cx = lamp.left + lamp.width / 2;
  // центр плафона: от него решаем, вверх или вниз выходит стойка и куда
  // клонится скос — верхние карточки целятся в плафон, нижние в корпус
  const cy = lamp.top + lamp.height * 0.33;

  const down = cy > (card.top + card.bottom) / 2;
  const y0 = down ? card.bottom : card.top;
  const y1 = y0 + (down ? stub : -stub);

  const side: -1 | 1 = midX < cx ? -1 : 1; // с какой стороны лампы карточка
  const dirX = -side; // скос идёт к лампе
  const dirY = cy > y1 ? 1 : -1; // и к её середине по высоте

  for (let d = diag; d >= 0; d -= 4) {
    const ty = y1 + d * dirY;
    const yFrac = (ty - lamp.top) / lamp.height;
    if (yFrac < 0.02 || yFrac > 0.92) continue;
    const tx = lamp.left + edge(yFrac, side) * lamp.width;
    const kneeX = tx - d * dirX;
    // полка должна идти от карточки к лампе, не назад
    if ((kneeX - midX) * dirX < 0) continue;
    return {
      d: `M ${midX} ${y0} L ${midX} ${y1} L ${kneeX} ${y1} L ${tx} ${ty}`,
      dotX: tx,
      dotY: ty,
      x0: midX,
      y0,
    };
  }
  return null;
}

/** Кладёт готовую выноску в группу SVG. */
export function applyLeader(
  group: SVGGElement,
  grad: Element | undefined,
  leader: Leader | null
) {
  // Карточка внутри габарита лампы — выноску не рисуем. Прячем атрибутом,
  // а не opacity: его перебивает CSS появления карточек в «Философии».
  if (!leader) {
    group.setAttribute("visibility", "hidden");
    return;
  }
  group.removeAttribute("visibility");
  group.querySelector("[data-leader-line]")?.setAttribute("d", leader.d);
  const dot = group.querySelector("[data-leader-dot]");
  dot?.setAttribute("cx", String(leader.dotX));
  dot?.setAttribute("cy", String(leader.dotY));
  if (grad) {
    grad.setAttribute("x1", String(leader.x0));
    grad.setAttribute("y1", String(leader.y0));
    grad.setAttribute("x2", String(leader.dotX));
    grad.setAttribute("y2", String(leader.dotY));
  }
}
