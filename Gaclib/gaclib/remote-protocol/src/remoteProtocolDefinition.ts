import * as TYPES from './remoteProtocolPrimitiveTypes.js';

export enum WindowHitTestResult {
   BorderNoSizing = 'BorderNoSizing',
   BorderLeft = 'BorderLeft',
   BorderRight = 'BorderRight',
   BorderTop = 'BorderTop',
   BorderBottom = 'BorderBottom',
   BorderLeftTop = 'BorderLeftTop',
   BorderRightTop = 'BorderRightTop',
   BorderLeftBottom = 'BorderLeftBottom',
   BorderRightBottom = 'BorderRightBottom',
   Title = 'Title',
   ButtonMinimum = 'ButtonMinimum',
   ButtonMaximum = 'ButtonMaximum',
   ButtonClose = 'ButtonClose',
   Client = 'Client',
   Icon = 'Icon',
   NoDecision = 'NoDecision',
}

export enum WindowSystemCursorType {
   SmallWaiting = 'SmallWaiting',
   LargeWaiting = 'LargeWaiting',
   Arrow = 'Arrow',
   Cross = 'Cross',
   Hand = 'Hand',
   Help = 'Help',
   IBeam = 'IBeam',
   SizeAll = 'SizeAll',
   SizeNESW = 'SizeNESW',
   SizeNS = 'SizeNS',
   SizeNWSE = 'SizeNWSE',
   SizeWE = 'SizeWE',
}

export enum WindowSizeState {
   Minimized = 'Minimized',
   Restored = 'Restored',
   Maximized = 'Maximized',
}

export enum IOMouseButton {
   Left = 'Left',
   Middle = 'Middle',
   Right = 'Right',
}

export enum ElementShapeType {
   Rectangle = 'Rectangle',
   Ellipse = 'Ellipse',
   RoundRect = 'RoundRect',
}

export enum ElementGradientrDirection {
   Horizontal = 'Horizontal',
   Vertical = 'Vertical',
   Slash = 'Slash',
   Backslash = 'Backslash',
}

export enum ElementSplitterDirection {
   Horizontal = 'Horizontal',
   Vertical = 'Vertical',
}

export enum ElementHorizontalAlignment {
   Left = 'Left',
   Right = 'Right',
   Center = 'Center',
}

export enum ElementVerticalAlignment {
   Top = 'Top',
   Bottom = 'Bottom',
   Center = 'Center',
}

export enum ElementSolidLabelMeasuringRequest {
   FontHeight = 'FontHeight',
   TotalSize = 'TotalSize',
}

export enum ImageFormatType {
   Bmp = 'Bmp',
   Gif = 'Gif',
   Icon = 'Icon',
   Jpeg = 'Jpeg',
   Png = 'Png',
   Tiff = 'Tiff',
   Wmp = 'Wmp',
   Unknown = 'Unknown',
}

export enum RendererType {
   FocusRectangle = 'FocusRectangle',
   Raw = 'Raw',
   SolidBorder = 'SolidBorder',
   SinkBorder = 'SinkBorder',
   SinkSplitter = 'SinkSplitter',
   SolidBackground = 'SolidBackground',
   GradientBackground = 'GradientBackground',
   InnerShadow = 'InnerShadow',
   SolidLabel = 'SolidLabel',
   Polygon = 'Polygon',
   ImageFrame = 'ImageFrame',
   UnsupportedColorizedText = 'UnsupportedColorizedText',
   UnsupportedDocument = 'UnsupportedDocument',
}

export enum RenderingDom_DiffType {
   Deleted = 'Deleted',
   Created = 'Created',
   Modified = 'Modified',
}

export type UnitTest_ElementDescVariant = TYPES.Variant<[ElementDesc_SolidBorder, ElementDesc_SinkBorder, ElementDesc_SinkSplitter, ElementDesc_SolidBackground, ElementDesc_GradientBackground, ElementDesc_InnerShadow, ElementDesc_Polygon, ElementDesc_SolidLabel, ElementDesc_ImageFrame]>;

export interface NativeCoordinate {
   value: TYPES.Integer;
}

export interface NativePoint {
   x: NativeCoordinate;
   y: NativeCoordinate;
}

export interface NativeSize {
   x: NativeCoordinate;
   y: NativeCoordinate;
}

export interface NativeRect {
   x1: NativeCoordinate;
   y1: NativeCoordinate;
   x2: NativeCoordinate;
   y2: NativeCoordinate;
}

export interface NativeMargin {
   left: NativeCoordinate;
   top: NativeCoordinate;
   right: NativeCoordinate;
   bottom: NativeCoordinate;
}

export interface Point {
   x: TYPES.Integer;
   y: TYPES.Integer;
}

export interface Size {
   x: TYPES.Integer;
   y: TYPES.Integer;
}

export interface Rect {
   x1: TYPES.Integer;
   y1: TYPES.Integer;
   x2: TYPES.Integer;
   y2: TYPES.Integer;
}

export interface FontProperties {
   fontFamily: TYPES.String;
   size: TYPES.Integer;
   bold: TYPES.Boolean;
   italic: TYPES.Boolean;
   underline: TYPES.Boolean;
   strikeline: TYPES.Boolean;
   antialias: TYPES.Boolean;
   verticalAntialias: TYPES.Boolean;
}

export interface FontConfig {
   defaultFont: FontProperties;
   supportedFonts: TYPES.List<TYPES.String>;
}

export interface ScreenConfig {
   bounds: NativeRect;
   clientBounds: NativeRect;
   scalingX: TYPES.Double;
   scalingY: TYPES.Double;
}

export interface WindowSizingConfig {
   bounds: NativeRect;
   clientBounds: NativeRect;
   sizeState: WindowSizeState;
   customFramePadding: NativeMargin;
}

export interface WindowShowing {
   activate: TYPES.Boolean;
   sizeState: WindowSizeState;
}

export interface IOMouseInfo {
   ctrl: TYPES.Boolean;
   shift: TYPES.Boolean;
   left: TYPES.Boolean;
   middle: TYPES.Boolean;
   right: TYPES.Boolean;
   x: NativeCoordinate;
   y: NativeCoordinate;
   wheel: TYPES.Integer;
   nonClient: TYPES.Boolean;
}

export interface IOMouseInfoWithButton {
   button: IOMouseButton;
   info: IOMouseInfo;
}

export interface IOKeyInfo {
   code: TYPES.Key;
   ctrl: TYPES.Boolean;
   shift: TYPES.Boolean;
   alt: TYPES.Boolean;
   capslock: TYPES.Boolean;
   autoRepeatKeyDown: TYPES.Boolean;
}

export interface IOCharInfo {
   code: TYPES.Char;
   ctrl: TYPES.Boolean;
   shift: TYPES.Boolean;
   alt: TYPES.Boolean;
   capslock: TYPES.Boolean;
}

export interface GlobalShortcutKey {
   id: TYPES.Integer;
   ctrl: TYPES.Boolean;
   shift: TYPES.Boolean;
   alt: TYPES.Boolean;
   code: TYPES.Key;
}

export interface ElementShape {
   shapeType: ElementShapeType;
   radiusX: TYPES.Integer;
   radiusY: TYPES.Integer;
}

export interface ElementDesc_SolidBorder {
   id: TYPES.Integer;
   borderColor: TYPES.Color;
   shape: ElementShape;
}

export interface ElementDesc_SinkBorder {
   id: TYPES.Integer;
   leftTopColor: TYPES.Color;
   rightBottomColor: TYPES.Color;
}

export interface ElementDesc_SinkSplitter {
   id: TYPES.Integer;
   leftTopColor: TYPES.Color;
   rightBottomColor: TYPES.Color;
   direction: ElementSplitterDirection;
}

export interface ElementDesc_SolidBackground {
   id: TYPES.Integer;
   backgroundColor: TYPES.Color;
   shape: ElementShape;
}

export interface ElementDesc_GradientBackground {
   id: TYPES.Integer;
   leftTopColor: TYPES.Color;
   rightBottomColor: TYPES.Color;
   direction: ElementGradientrDirection;
   shape: ElementShape;
}

export interface ElementDesc_InnerShadow {
   id: TYPES.Integer;
   shadowColor: TYPES.Color;
   thickness: TYPES.Integer;
}

export interface ElementDesc_Polygon {
   id: TYPES.Integer;
   size: Size;
   borderColor: TYPES.Color;
   backgroundColor: TYPES.Color;
   points: TYPES.List<Point>;
}

export interface ElementDesc_SolidLabel {
   id: TYPES.Integer;
   textColor: TYPES.Color;
   horizontalAlignment: ElementHorizontalAlignment;
   verticalAlignment: ElementVerticalAlignment;
   wrapLine: TYPES.Boolean;
   wrapLineHeightCalculation: TYPES.Boolean;
   ellipse: TYPES.Boolean;
   multiline: TYPES.Boolean;
   font: TYPES.Nullable<FontProperties>;
   text: TYPES.Nullable<TYPES.String>;
   measuringRequest: TYPES.Nullable<ElementSolidLabelMeasuringRequest>;
}

export interface ImageCreation {
   id: TYPES.Integer;
   imageData: TYPES.Binary;
   imageDataOmitted: TYPES.Boolean;
}

export interface ImageFrameMetadata {
   size: Size;
}

export interface ImageMetadata {
   id: TYPES.Integer;
   format: ImageFormatType;
   frames: TYPES.List<ImageFrameMetadata>;
}

export interface ElementDesc_ImageFrame {
   id: TYPES.Integer;
   imageId: TYPES.Nullable<TYPES.Integer>;
   imageFrame: TYPES.Integer;
   horizontalAlignment: ElementHorizontalAlignment;
   verticalAlignment: ElementVerticalAlignment;
   stretch: TYPES.Boolean;
   enabled: TYPES.Boolean;
   imageCreation: TYPES.Nullable<ImageCreation>;
}

export interface RendererCreation {
   id: TYPES.Integer;
   type: RendererType;
}

export interface ElementBeginRendering {
   frameId: TYPES.Integer;
}

export interface ElementRendering {
   id: TYPES.Integer;
   bounds: Rect;
   areaClippedByParent: Rect;
}

export interface ElementBoundary {
   id: TYPES.Integer;
   hitTestResult: TYPES.Nullable<WindowHitTestResult>;
   cursor: TYPES.Nullable<WindowSystemCursorType>;
   bounds: Rect;
   areaClippedBySelf: Rect;
}

export interface ElementMeasuring_FontHeight {
   fontFamily: TYPES.String;
   fontSize: TYPES.Integer;
   height: TYPES.Integer;
}

export interface ElementMeasuring_ElementMinSize {
   id: TYPES.Integer;
   minSize: Size;
}

export interface ElementMeasurings {
   fontHeights: TYPES.List<ElementMeasuring_FontHeight>;
   minSizes: TYPES.List<ElementMeasuring_ElementMinSize>;
   createdImages: TYPES.List<ImageMetadata>;
}

export interface RenderingDomContent {
   hitTestResult: TYPES.Nullable<WindowHitTestResult>;
   cursor: TYPES.Nullable<WindowSystemCursorType>;
   element: TYPES.Nullable<TYPES.Integer>;
   bounds: Rect;
   validArea: Rect;
}

export interface RenderingDom {
   id: TYPES.Integer;
   content: RenderingDomContent;
   children: TYPES.List<TYPES.Ptr<RenderingDom>>;
}

export interface RenderingDom_Diff {
   id: TYPES.Integer;
   diffType: RenderingDom_DiffType;
   content: TYPES.Nullable<RenderingDomContent>;
   children: TYPES.List<TYPES.Integer>;
}

export interface RenderingDom_DiffsInOrder {
   diffsInOrder: TYPES.List<RenderingDom_Diff>;
}

export interface UnitTest_RenderingFrame {
   frameId: TYPES.Integer;
   frameName: TYPES.Nullable<TYPES.String>;
   windowSize: WindowSizingConfig;
   elements: TYPES.Dictionary<TYPES.Integer, UnitTest_ElementDescVariant>;
   root: TYPES.Ptr<RenderingDom>;
}

export interface UnitTest_RenderingTrace {
   createdElements: TYPES.Dictionary<TYPES.Integer, RendererType>;
   imageCreations: TYPES.ArrayMap<ImageCreation, 'id'>;
   imageMetadatas: TYPES.ArrayMap<ImageMetadata, 'id'>;
   frames: TYPES.List<UnitTest_RenderingFrame>;
}

export interface IRemoteProtocolRequests {
}

export interface IRemoteProtocolResponses {
}

export interface IRemoteProtocolEvents {
}
