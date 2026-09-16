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

/** Кладёт готовую выноску в группу SVG. */
export function applyLeader(
  group: SVGGElement,
  grad: Element | undefined,
  leader: Leader | null
) {
  if (!leader) {
    group.setAttribute("opacity", "0");
    return;
  }
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
