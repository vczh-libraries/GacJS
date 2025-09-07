# ToDo

- `IGraphicsParagraph` and typing events.
- More elegant way of helping people make `gacui-screen` focusable in `index.html`.

## IGuiGraphicsParagraph

- document.createRange().setStart/setEnd can locate character position if it is in a Text node.
  - This means I can break a paragraph into a series of Span over Text, and calculate caret position easily.
  - But how do I traverse all caret positions in a paragraph?
- range.getClientRects returns an array for each line. If LTR/RTL are mixed, a rect represents only one direction.

## Known Issues

- Gaclib\gaclib\renderer\src\elementStyles.ts
  - There is a branch in `initializeText`, for both activated `Ellipse` and `WrapLine`.
    - If feature gate `useWebkitLineClamp` is off, '...' won't render
    - If feature gate `useWebkitLineClamp` is on, sometimes '...' is missing with right alignment.
  - Vertical alignment doesn't work when the total text height is larger than its container.
- In Chrome `Segoe WP SemiLight` for the window title seems to render like a default font. GacUI behaves correctly.
  - May need to support font family substitution in `GacUIHtmlRendererImpl`.

## Further Experiments

- Canvas instead of DOM.
  - https://github.com/WICG/canvas-formatted-text/blob/main/README.md
  - layout provider could not be done until this is implemented.
