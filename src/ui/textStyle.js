export const UI_FONT_FAMILY = '"Press Start 2P", "Arial Black", system-ui, sans-serif';

export function uiTextStyle(size, color = '#ffffff', strokeThickness = 2) {
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
