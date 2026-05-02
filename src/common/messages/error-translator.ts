import { I18nContext } from 'nestjs-i18n';

const DEFAULT_ERROR_LANG = 'fa';

const entityKeyMap: Record<string, string> = {
  user: 'user',
  permission: 'permission',
  role: 'role',
  comment: 'comment',
  course: 'course',
  usercourse: 'user_course',
  'course step': 'course_step',
  coursestep: 'course_step',
  'course lesson': 'course_lesson',
  courselesson: 'course_lesson',
  teacher: 'teacher',
  discount: 'discount',
  file: 'file',
  notification: 'notification',
  survey: 'survey',
  achievement: 'achievement',
  project: 'project',
  'user project': 'user_project',
  userproject: 'user_project',
  faq: 'faq',
  sms: 'sms',
  smstemplate: 'sms_template',
};

export function tError(
  key: string,
  args?: Record<string, string | number | boolean>,
  fallback?: string,
): string {
  const i18n = I18nContext.current();
  const lang = i18n?.lang || DEFAULT_ERROR_LANG;
  const translated = i18n?.t(key, { lang, args }) as string | undefined;

  if (!translated || translated === key) {
    return fallback || key;
  }

  return translated;
}

export function localizeEntityLabel(entity: string): string {
  if (!entity) {
    return entity;
  }

  const normalized = entity.toLowerCase().trim();
  const entityKey = entityKeyMap[normalized] || normalized.replace(/\s+/g, '_');
  const i18nKey = `errors.entities.${entityKey}`;

  return tError(i18nKey, undefined, entity);
}

export function localizeErrorMessage(message: string): string {
  if (!message) {
    return message;
  }

  const normalizedMessage = message.trim();
  const directMap: Record<string, string> = {
    'Bad Request': 'errors.bad_request',
    'Internal server error': 'errors.internal_server_error',
    'internal server error': 'errors.internal_server_error',
    Forbidden: 'errors.forbidden',
    'Forbidden resource': 'errors.forbidden_resource',
    unauthorized: 'errors.unauthorized',
    Unauthorized: 'errors.unauthorized',
    'phone number is not verified': 'errors.phone_not_verified',
    'please verify your email or phoneNumber': 'errors.verify_email_or_phone',
    'too many request': 'errors.too_many_requests',
    'categoryId can not be null': 'errors.category_id_required',
    'PermmissionId can not be null': 'errors.permission_id_required',
    'Only admins can reply to course comments':
      'errors.only_admin_can_reply_course_comment',
    'discount usage limit reached': 'errors.discount_usage_limit_reached',
    'login required for this discount': 'errors.discount_login_required',
    'user usage limit reached': 'errors.discount_user_usage_limit_reached',
    'discount is inactive': 'errors.discount_inactive',
    'discount not started yet': 'errors.discount_not_started',
    'discount expired': 'errors.discount_expired',
    'failed to connect to zarinpal gateway':
      'errors.zarinpal_connection_failed',
    'zarinpal merchant id is not configured':
      'errors.zarinpal_not_configured',
    'order amount is zero and has been completed as paid':
      'errors.order_zero_paid',
    'payment authority is required for verification':
      'errors.order_authority_required_verify',
    'only pending orders can be canceled':
      'errors.order_only_pending_cancel',
    'payment authority is required for inquiry':
      'errors.order_authority_required_inquiry',
    'order has expired, please create a new order': 'errors.order_expired',
    'something went wrong': 'errors.something_went_wrong',
    'Draft not found': 'errors.sms_draft_not_found',
    'Template not found or returned empty text': 'errors.sms_template_not_found',
    'Enter at least one shift': 'errors.shift_enter_at_least_one',
    'If you didnt provide templateId, you must provide text.':
      'errors.sms_template_or_text_required',
    'If you didnt provide the message text, you must provide templateId.':
      'errors.sms_template_required_without_text',
    'userId is required while using template':
      'errors.sms_userid_required_with_template',
  };

  if (directMap[normalizedMessage]) {
    return tError(directMap[normalizedMessage], undefined, normalizedMessage);
  }

  const validationPatterns: Array<{
    regex: RegExp;
    key: string;
    fallback: (match: RegExpMatchArray) => string;
  }> = [
    {
      regex: /^(.+?) should not be empty$/,
      key: 'errors.validation.should_not_be_empty',
      fallback: (match) => `${match[1]} should not be empty`,
    },
    {
      regex: /^(.+?) should not exist$/,
      key: 'errors.validation.should_not_exist',
      fallback: (match) => `${match[1]} should not exist`,
    },
    {
      regex: /^(.+?) must be a string$/,
      key: 'errors.validation.must_be_string',
      fallback: (match) => `${match[1]} must be a string`,
    },
    {
      regex: /^(.+?) must be an integer number$/,
      key: 'errors.validation.must_be_integer',
      fallback: (match) => `${match[1]} must be an integer number`,
    },
    {
      regex: /^(.+?) must be a UUID$/,
      key: 'errors.validation.must_be_uuid',
      fallback: (match) => `${match[1]} must be a UUID`,
    },
    {
      regex: /^(.+?) must be a boolean value$/,
      key: 'errors.validation.must_be_boolean',
      fallback: (match) => `${match[1]} must be a boolean value`,
    },
    {
      regex: /^(.+?) must be a valid enum value$/,
      key: 'errors.validation.must_be_enum',
      fallback: (match) => `${match[1]} must be a valid enum value`,
    },
    {
      regex: /^(.+?) must be a number conforming to the specified constraints$/,
      key: 'errors.validation.must_be_number',
      fallback: (match) =>
        `${match[1]} must be a number conforming to the specified constraints`,
    },
    {
      regex: /^(.+?) must be a URL address$/,
      key: 'errors.validation.must_be_url',
      fallback: (match) => `${match[1]} must be a URL address`,
    },
    {
      regex: /^One of (.+) must be submitted\.$/,
      key: 'errors.rules.one_of_must_be_submitted',
      fallback: (match) => `One of ${match[1]} must be submitted.`,
    },
    {
      regex: /^Exactly one of (.+) must be submitted\.$/,
      key: 'errors.rules.exactly_one_must_be_submitted',
      fallback: (match) => `Exactly one of ${match[1]} must be submitted.`,
    },
    {
      regex: /^Only one of (.+) is allowed\.$/,
      key: 'errors.rules.only_one_allowed',
      fallback: (match) => `Only one of ${match[1]} is allowed.`,
    },
    {
      regex: /^just one of (.+) is allowed$/,
      key: 'errors.rules.only_one_allowed',
      fallback: (match) => `Only one of ${match[1]} is allowed.`,
    },
    {
      regex: /^permission (.+) already exists$/,
      key: 'errors.rules.permission_already_exists',
      fallback: (match) => `permission ${match[1]} already exists`,
    },
  ];

  for (const pattern of validationPatterns) {
    const match = normalizedMessage.match(pattern.regex);
    if (match) {
      return tError(pattern.key, { property: match[1] }, pattern.fallback(match));
    }
  }

  return tError(normalizedMessage, undefined, normalizedMessage);
}
