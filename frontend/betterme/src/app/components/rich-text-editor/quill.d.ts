declare module 'quill' {
  export default class Quill {
    constructor(container: HTMLElement, options?: any);
    enable(enabled: boolean): void;
    on(event: string, handler: (...args: any[]) => void): void;
    root: {
      innerHTML: string;
      setAttribute(name: string, value: string): void;
    };
  }
}

