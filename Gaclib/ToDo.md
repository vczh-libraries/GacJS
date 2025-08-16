# ToDo

- `IVirtualDomProvider`
  - Should allow `IVirtualDom` to change `element` freely, delete the limitation, because composition can always change element. The limitation should apply to update requests.
  - Implement the HTML `IVirtualDomProvider` and test it in elements.html
  - Implement `RenderingDom` -> `IVirtualDom` but not consider `validArea` yet.
  - Consider `validArea` in `createVirtualDomFromRenderingDom`.
  - Apply `RenderingDom_Diff` on `IVirtualDom`.
- Add a package to copy all GacUISrc/UnitText snapsnots and render in Snapshots.html
- `snapshot.html` to render snapshots, will clickable but not collapsible tree view at the left.
- Implement remote protocol rendering.
- Handle remote exception.
- Complete a demo, website and C++ renderer connect to Core in turns.
  - in each turn do something and it will be taken to the next. (already doable with multiple C++ renderers).
  - record as GIF

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
