declare module 'exceljs' {
  export class Workbook {
    creator: string;
    lastModifiedBy: string;
    created: Date;
    modified: Date;
    properties: WorkbookProperties;
    views: WorkbookView[];
    worksheets: Worksheet[];

    addWorksheet(name: string, options?: WorksheetOptions): Worksheet;
    getWorksheet(nameOrId: string | number): Worksheet | undefined;
    removeWorksheet(nameOrId: string | number): void;
    eachSheet(callback: (worksheet: Worksheet, id: number) => void): void;
    commit(): Promise<void>;
    xlsx: Xlsx;
    csv: Csv;
  }

  export interface WorkbookProperties {
    title?: string;
    subject?: string;
    author?: string;
    manager?: string;
    company?: string;
    category?: string;
    keywords?: string;
    comments?: string;
    status?: string;
  }

  export interface WorkbookView {
    x: number;
    y: number;
    width: number;
    height: number;
    firstSheet: number;
    activeTab: number;
    visibility: 'visible' | 'hidden' | 'veryHidden';
  }

  export class Worksheet {
    name: string;
    id: number;
    state: 'visible' | 'hidden' | 'veryHidden';
    properties: WorksheetProperties;
    views: WorksheetView[];
    columns: Partial<Column>[];
    rows: Row[];

    addRow(data: any[]): Row;
    getRow(index: number): Row;
    getColumn(index: number): Column;
    commit(): Promise<void>;
  }

  export interface WorksheetProperties {
    tabColor?: Color;
    outlineLevel?: number;
    defaultRowHeight?: number;
    defaultColWidth?: number;
  }

  export interface WorksheetView {
    state: 'normal' | 'frozen' | 'split';
    xSplit?: number;
    ySplit?: number;
    topLeftCell?: string;
    activeCell?: string;
  }

  export interface Column {
    key?: string;
    header?: string | string[];
    width?: number;
    style?: Style;
    hidden?: boolean;
    outlineLevel?: number;
  }

  export class Row {
    number: number;
    values: any[];
    height?: number;
    hidden?: boolean;
    outlineLevel?: number;

    commit(): Promise<void>;
  }

  export interface Style {
    font?: Font;
    alignment?: Alignment;
    border?: Border;
    fill?: Fill;
    numFmt?: string;
  }

  export interface Font {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean | 'single' | 'double';
    color?: Color;
  }

  export interface Alignment {
    horizontal?:
      | 'left'
      | 'center'
      | 'right'
      | 'fill'
      | 'justify'
      | 'centerContinuous'
      | 'distributed';
    vertical?: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
    wrapText?: boolean;
    indent?: number;
    readingOrder?: 'rtl' | 'ltr';
  }

  export interface Border {
    top?: BorderStyle;
    left?: BorderStyle;
    bottom?: BorderStyle;
    right?: BorderStyle;
  }

  export interface BorderStyle {
    style?:
      | 'thin'
      | 'medium'
      | 'thick'
      | 'dashed'
      | 'dotted'
      | 'double'
      | 'hair';
    color?: Color;
  }

  export interface Fill {
    type?: 'pattern' | 'gradient';
    pattern?:
      | 'solid'
      | 'darkVertical'
      | 'darkHorizontal'
      | 'lightVertical'
      | 'lightHorizontal';
    fgColor?: Color;
    bgColor?: Color;
  }

  export interface Color {
    argb?: string;
    theme?: number;
    tint?: number;
  }

  export class Xlsx {
    readFile(path: string): Promise<Workbook>;
    writeFile(path: string): Promise<void>;
  }

  export class Csv {
    readFile(path: string): Promise<Worksheet>;
    writeFile(path: string): Promise<void>;
  }
}

export namespace stream {
  export namespace xlsx {
    export class WorkbookReader {
      constructor(
        filePath: string,
        options?: {
          entries?: 'emit' | 'cache';
          sharedStrings?: 'emit' | 'cache';
          worksheets?: 'emit' | 'cache';
        },
      );

      on(event: 'worksheet', listener: (worksheet: Worksheet) => void): this;
      on(
        event: 'shared-string',
        listener: (sharedString: string) => void,
      ): this;
      on(event: 'entry', listener: (entry: any) => void): this;
      on(event: 'finished', listener: () => void): this;
      on(event: 'error', listener: (error: Error) => void): this;

      read(): Promise<void>;
    }
  }
}
