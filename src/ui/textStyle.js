export const UI_FONT_FAMILY = '"Press Start 2P", "Arial Black", system-ui, sans-serif';

export function textStrokeForSize(size) {
  if (size <= 6) return 1;
  if (size <= 10) return 2;
  return 3;
}

export function uiTextStyle(size, color = '#ffffff', strokeThickness = textStrokeForSize(size)) {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    stroke: '#101020',
    strokeThickness,
    shadow: {
      offsetX: 1,
      offsetY: 1,
      color: '#000000',
      blur: 0,
      stroke: false,
      fill: true,
    },
  };
}
