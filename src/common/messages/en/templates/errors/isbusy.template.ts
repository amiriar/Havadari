import Handlebars from 'handlebars';

const busy = '{{entity}} is busy at your selected date-time';
export const isbusyTemplate = Handlebars.compile(busy);
