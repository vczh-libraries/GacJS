# ToDo

- Review `keyMapping.ts`
- Global shortcut key.
  - `RequestIOUpdateGlobalShortcutKey`
  - Although we cannot make it actually global, but at least need to work in the browser window.
- Make `index.html` resize window when browser view port changed.
- Existing.
  - `requestStopToCore`
  - `RequestControllerConnectionStopped`
  - Close menu items x4.

## Future

- `IGraphicsParagraph` and typing events.

## Known Issues

- Gaclib\gaclib\renderer\src\elementStyles.ts
  - There is a branch in `initializeText`, for both activated `Ellipse` and `WrapLine`.
    - If feature gate `useWebkitLineClamp` is off, '...' won't render
    - If feature gate `useWebkitLineClamp` is on, sometimes '...' is missing with right alignment.
  - Vertical alignment doesn't work when the total text height is larger than its container.

## Further Experiments

- Canvas instead of DOM.
  - https://github.com/WICG/canvas-formatted-text/blob/main/README.md
  - layout provider could not be done until this is implemented.
