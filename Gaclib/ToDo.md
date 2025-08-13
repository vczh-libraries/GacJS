# ToDo

- Implement css styles for elements except image and label.
- Create a IVirtualDom for mocking HTMLElement, 1:1 mappings.
- Implement the HTML provider and test it in elements.html, but not considering extra clipping (validBounds).
- Create unit test for RenderingDom -> IVirtualDom.
  - Consider validBounds.
  - Apply diff.
- Make a more complicated case in elements.xml.
  - Considering adding tabs.
- Implement cas styles for image and text.
  - SolidLable may not need extra border element as each of them will set font explicitly.
- Implement remote protocol rendering.
- Handle remote exception.
- Complete a demo, website and C++ renderer connect to Core in turns.
  - in each turn do something and it will be taken to the next. (already doable with multiple C++ renderers).
  - record as GIF
