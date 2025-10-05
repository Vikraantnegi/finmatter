/**
 * Date utilities for FinMatter
 */

import {
  parseISO,
  isValid,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

/**
 * Get current date in ISO format
 */
export const getCurrentDateISO = (): string => {
  return new Date().toISOString();
};

/**
 * Get current date as Date object
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (isoString: string): Date | null => {
  try {
    const date = parseISO(isoString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Format date to ISO string
 */
export const formatToISO = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }

    return dateObj.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Get start of day
 */
export const getStartOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Get end of day
 */
export const getEndOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Get start of month
 */
export const getStartOfMonth = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfMonth(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Get end of month
 */
export const getEndOfMonth = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfMonth(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Get start of year
 */
export const getStartOfYear = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfYear(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Get end of year
 */
export const getEndOfYear = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfYear(isValid(dateObj) ? dateObj : new Date());
};

/**
 * Add days to date
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(isValid(dateObj) ? dateObj : new Date(), days);
};

/**
 * Add months to date
 */
export const addMonthsToDate = (date: Date | string, months: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(isValid(dateObj) ? dateObj : new Date(), months);
};

/**
 * Add years to date
 */
export const addYearsToDate = (date: Date | string, years: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addYears(isValid(dateObj) ? dateObj : new Date(), years);
};

/**
 * Subtract days from date
 */
export const subtractDaysFromDate = (
  date: Date | string,
  days: number,
): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subDays(isValid(dateObj) ? dateObj : new Date(), days);
};

/**
 * Subtract months from date
 */
export const subtractMonthsFromDate = (
  date: Date | string,
  months: number,
): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subMonths(isValid(dateObj) ? dateObj : new Date(), months);
};

/**
 * Subtract years from date
 */
export const subtractYearsFromDate = (
  date: Date | string,
  years: number,
): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subYears(isValid(dateObj) ? dateObj : new Date(), years);
};

/**
 * Get difference in days between two dates
 */
export const getDaysDifference = (
  date1: Date | string,
  date2: Date | string,
): number => {
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;

  if (!isValid(date1Obj) || !isValid(date2Obj)) {
    return 0;
  }

  return differenceInDays(date2Obj, date1Obj);
};

/**
 * Get difference in months between two dates
 */
export const getMonthsDifference = (
  date1: Date | string,
  date2: Date | string,
): number => {
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;

  if (!isValid(date1Obj) || !isValid(date2Obj)) {
    return 0;
  }

  return differenceInMonths(date2Obj, date1Obj);
};

/**
 * Get difference in years between two dates
 */
export const getYearsDifference = (
  date1: Date | string,
  date2: Date | string,
): number => {
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;

  if (!isValid(date1Obj) || !isValid(date2Obj)) {
    return 0;
  }

  return differenceInYears(date2Obj, date1Obj);
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const yesterday = subDays(new Date(), 1);
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is in current month
 */
export const isCurrentMonth = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const now = new Date();
  return (
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
};

/**
 * Check if date is in current year
 */
export const isCurrentYear = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const now = new Date();
  return dateObj.getFullYear() === now.getFullYear();
};

/**
 * Get month name from date
 */
export const getMonthName = (
  date: Date | string,
  locale: string = 'en-US',
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString(locale, { month: 'long' });
};

/**
 * Get year from date
 */
export const getYear = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return new Date().getFullYear();
  }

  return dateObj.getFullYear();
};

/**
 * Get month from date (1-12)
 */
export const getMonth = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return new Date().getMonth() + 1;
  }

  return dateObj.getMonth() + 1;
};

/**
 * Get day from date (1-31)
 */
export const getDay = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return new Date().getDate();
  }

  return dateObj.getDate();
};

/**
 * Get day of week (0-6, Sunday = 0)
 */
export const getDayOfWeek = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return new Date().getDay();
  }

  return dateObj.getDay();
};

/**
 * Get week number of year
 */
export const getWeekNumber = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return 1;
  }

  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const days = Math.floor(
    (dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

/**
 * Generate date range for a period
 */
export const generateDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  interval: 'day' | 'week' | 'month' | 'year' = 'day',
): Date[] => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (!isValid(start) || !isValid(end)) {
    return [];
  }

  const dates: Date[] = [];
  let current = start;

  while (current <= end) {
    dates.push(new Date(current));

    switch (interval) {
      case 'day':
        current = addDays(current, 1);
        break;
      case 'week':
        current = addDays(current, 7);
        break;
      case 'month':
        current = addMonths(current, 1);
        break;
      case 'year':
        current = addYears(current, 1);
        break;
    }
  }

  return dates;
};

/**
 * Get fiscal year for a date (April to March in India)
 */
export const getFiscalYear = (
  date: Date | string,
): { start: Date; end: Date; year: string } => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    const now = new Date();
    return getFiscalYear(now);
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-12

  let fiscalYear: number;
  let fiscalStart: Date;
  let fiscalEnd: Date;

  if (month >= 4) {
    // April to December - current fiscal year
    fiscalYear = year;
    fiscalStart = new Date(year, 3, 1); // April 1st
    fiscalEnd = new Date(year + 1, 2, 31); // March 31st next year
  } else {
    // January to March - previous fiscal year
    fiscalYear = year - 1;
    fiscalStart = new Date(year - 1, 3, 1); // April 1st previous year
    fiscalEnd = new Date(year, 2, 31); // March 31st current year
  }

  return {
    start: fiscalStart,
    end: fiscalEnd,
    year: `${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`,
  };
};

/**
 * Get quarter for a date
 */
export const getQuarter = (
  date: Date | string,
): { quarter: number; start: Date; end: Date; year: number } => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    const now = new Date();
    return getQuarter(now);
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-12

  let quarter: number;
  let startMonth: number;
  let endMonth: number;

  if (month <= 3) {
    quarter = 1;
    startMonth = 0; // January
    endMonth = 2; // March
  } else if (month <= 6) {
    quarter = 2;
    startMonth = 3; // April
    endMonth = 5; // June
  } else if (month <= 9) {
    quarter = 3;
    startMonth = 6; // July
    endMonth = 8; // September
  } else {
    quarter = 4;
    startMonth = 9; // October
    endMonth = 11; // December
  }

  return {
    quarter,
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0), // Last day of the end month
    year,
  };
};

/**
 * Check if date is weekend
 */
export const isWeekend = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const dayOfWeek = dateObj.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

/**
 * Check if date is business day
 */
export const isBusinessDay = (date: Date | string): boolean => {
  return !isWeekend(date);
};

/**
 * Get next business day
 */
export const getNextBusinessDay = (date: Date | string): Date => {
  let current = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(current)) {
    current = new Date();
  }

  do {
    current = addDays(current, 1);
  } while (isWeekend(current));

  return current;
};

/**
 * Get previous business day
 */
export const getPreviousBusinessDay = (date: Date | string): Date => {
  let current = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(current)) {
    current = new Date();
  }

  do {
    current = subDays(current, 1);
  } while (isWeekend(current));

  return current;
};
