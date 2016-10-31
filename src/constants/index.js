// This file contains default constants of the application.
export const CONFIG_FILE = 'config.json';
export const DEFAULT_DATA_DIR = '/data';
export const DEFAULT_TABLES_IN_DIR = '/in/tables';
export const DEFAULT_TABLES_OUT_DIR = '/out/tables';
export const REPORT_SALES_TYPE = 'sales';
export const REPORT_FINANCIAL_TYPE = 'financial';
export const IS_INCREMENTAL = true;
export const DATE_TYPE = 'Daily';
export const REPORT_MODE = 'Robot.XML';
export const PRIMARY_KEY = [ 'id' ];
export const REPORT_SUB_TYPE = 'Summary';
export const FINANCE_REGIONS = [
  "AE", "AU", "CA", "CH", "DK", "EU", "GB", "HK",
  "ID", "IL", "IN", "JP", "MX", "NO", "NZ", "RU",
  "SA", "SE", "SG", "TR", "TW", "US", "WW", "ZA"
];
export const SALES_KEYS = [
  "Provider", "Provider Country", "Vendor Identifier", "Artist / Show", "Title",
  "Label/Studio/Network", "Product Type Identifier", "Begin Date", "End Date",
  "Customer Currency", "Country Code", "Royalty Currency", "Apple Identifier",
  "Asset/Content Flavor", "Vendor Offer Code", "Primary Genre"
];
export const EARNINGS_KEYS = [
  "Start Date", "End Date", "Vendor Identifier",
  "Partner Share Currency", "Sales or Return",
  "Apple Identifier", "Product Type Identifier",
  "Title", "Country Of Sale", "Customer Currency"
];
export const INITIAL_PERIOD = 9;
export const ENOTFOUND = 'ENOTFOUND';
export const ECONNRESET = 'ECONNRESET';
export const DATASET_EMPTY = 'DATASET_EMPTY';
export const DATASET_DOWNLOADED = 'DATASET_DOWNLOADED';
export const DEFAULT_DATE_MASK = 'YYYYMMDD';
export const DEFAULT_YEAR_MASK = 'YYYY';
export const MOMENT_PERIOD = 'days';
export const RESPONSE_TYPE = 'response';
export const DATA_TYPE = 'data';
export const ERROR_TYPE = 'error';
export const END_TYPE = 'end';
export const DEFAULT_BUCKET = 'in.c-ex-itunes';
export const CONNECTION_ERROR = 'Problem with connection to iTunes Connect! Please try it again!';
