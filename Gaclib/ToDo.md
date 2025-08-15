# ToDo

- Create a IVirtualDom for mocking HTMLElement, 1:1 mappings.
- Implement the HTML provider and test it in elements.html, but not considering extra clipping (validBounds).
- Create unit test for RenderingDom -> IVirtualDom.
  - Consider validBounds.
  - Apply diff.
- Add a package to copy all GacUISrc/UnitText snapsnots and render in Snapshots.html
- Make a more complicated case in elements.xml.
  - Considering adding tabs.
- Implement remote protocol rendering.
- Handle remote exception.
- Complete a demo, website and C++ renderer connect to Core in turns.
  - in each turn do something and it will be taken to the next. (already doable with multiple C++ renderers).
  - record as GIF

## Known Issues

- Gaclib\gaclib\renderer\src\elementStyles.ts
  - There is a branch in `initializeText`, for both activated `Ellipse` and `WrapLine`.
    - If we delete this branch, '...' won't render
    - If we keep this branch, '...' won't render only in right alignment, and the line number is fixed.

## Further Experiments

- Canvas instead of DOM.
  - https://github.com/WICG/canvas-formatted-text/blob/main/README.md
  - layout provider could not be done until this is implemented.
