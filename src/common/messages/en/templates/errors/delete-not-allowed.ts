import Handlebars from 'handlebars';

const deleteNotAllowed = 'Cannot delete {{entity}} which : {{reason}}';
export const canNotDeleteTemplate = Handlebars.compile(deleteNotAllowed);
