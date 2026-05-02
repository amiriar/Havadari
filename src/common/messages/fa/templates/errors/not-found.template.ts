import Handlebars from 'handlebars';

const notFound = 'پیدا نشد {{entity}}';
export const notFoundTemplate = Handlebars.compile(notFound);
