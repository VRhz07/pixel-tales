// Type definitions for fabric.js
declare namespace fabric {
  interface ICanvasOptions {
    width?: number;
    height?: number;
    backgroundColor?: string;
    isDrawingMode?: boolean;
  }

  interface IObjectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    selectable?: boolean;
    evented?: boolean;
    [key: string]: any;
  }
  
  interface ICircleOptions extends IObjectOptions {
    radius?: number;
  }
  
  interface ITextOptions extends IObjectOptions {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    fontStyle?: string;
    textAlign?: string;
  }

  interface IObject {
    set<T = any>(key: string, value: T): IObject;
    set<T = any>(options: T): IObject;
    get<T = any>(key: string): T;
    setOptions<T = any>(options: T): void;
    [key: string]: any;
  }

  interface ICanvas extends IObject {
    add(...objects: IObject[]): ICanvas;
    remove(...objects: IObject[]): ICanvas;
    renderAll(): void;
    setDimensions(dimensions: { width: number | string; height: number | string }, options?: any): void;
    getContext(): CanvasRenderingContext2D;
    toJSON(propertiesToInclude?: string[]): any;
    loadFromJSON(json: string, callback: () => void, reviver?: Function): void;
    dispose(): void;
    isDrawingMode: boolean;
    freeDrawingBrush: {
      width: number;
      color: string;
      [key: string]: any;
    };
  }

  interface IRect extends IObject {}
  interface ICircle extends IObject {}
  interface ITriangle extends IObject {}
  interface IPath extends IObject {}
  interface IText extends IObject {}
  interface IIText extends IText {}
  interface IPathGroup extends IObject {}
  interface IGroup extends IObject {}
}

declare const fabric: {
  // Canvas
  Canvas: new (element: string | HTMLCanvasElement, options?: fabric.ICanvasOptions) => fabric.ICanvas;
  
  // Shapes
  Rect: new (options?: fabric.IObjectOptions) => fabric.IRect;
  Circle: new (options?: fabric.ICircleOptions) => fabric.ICircle;
  Triangle: new (options?: fabric.IObjectOptions) => fabric.ITriangle;
  Path: new (path: string | any[], options?: fabric.IObjectOptions) => fabric.IPath;
  Text: new (text: string, options?: fabric.ITextOptions) => fabric.IText;
  IText: new (text: string, options?: fabric.ITextOptions) => fabric.IIText;
  
  // Version
  version: string;
  
  // Util
  util: {
    createClass(parent: any, properties: any): any;
    createCanvasElement(): HTMLCanvasElement;
    createImage(): HTMLImageElement;
    loadImage(url: string, callback: (img: HTMLImageElement) => void, context?: any): void;
  };
};

// Extend Window interface
declare global {
  interface Window {
    fabric: typeof fabric;
  }
}

export = fabric;
