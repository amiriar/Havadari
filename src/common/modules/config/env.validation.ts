import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // DB Configurations
  DB_TYPE: Joi.string().valid('postgres').optional(),
  DB_CONNECTION_STRING: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .optional(),
  DB_HOST: Joi.string().when('DB_CONNECTION_STRING', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().when('DB_CONNECTION_STRING', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_USERNAME: Joi.string().when('DB_CONNECTION_STRING', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASSWORD: Joi.string().when('DB_CONNECTION_STRING', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_NAME: Joi.string().when('DB_CONNECTION_STRING', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),

  // JWT Configurations
  JWT_SECRET: Joi.string().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),

  // Server Configurations
  APP_PORT: Joi.number().required(),
  BASE_URL: Joi.string().required(),
  SUPER_ADMIN_PASSWORD: Joi.string().required(),
  ORIGIN: Joi.string().required(),

  // Kavenegar Configurations
  KAVENEGAR_API_KEY: Joi.string().required(),
  KAVENEGAR_OTP_TEMPLATE: Joi.string().required(),
  KAVENEGAR_SENDER: Joi.string().allow('').optional(),
  OTP_SECRET: Joi.string().required(),
  FOOTBALL_DATA_API_KEY: Joi.string().optional(),
  FOOTBALL_DATA_BASE_URL: Joi.string().uri().optional(),
  API_FOOTBALL_API_KEY: Joi.string().optional(),
  API_FOOTBALL_BASE_URL: Joi.string().uri().optional(),
  API_FOOTBALL_WORLD_CUP_LEAGUE_ID: Joi.string().optional(),
  API_FOOTBALL_LEAGUE_IDS: Joi.string().optional(),
  FOOTBALL_DATA_COMPETITION_CODES: Joi.string().optional(),
  CARD_IMAGE_PROVIDER: Joi.string()
    .valid('placeholder', 'gemini', 'nano-banana')
    .optional(),
  CARD_IMAGE_PROVIDER_ENABLED: Joi.string().valid('true', 'false').optional(),
  GEMINI_API_KEY: Joi.string().optional(),
  GEMINI_API_BASE: Joi.string().uri().optional(),
  GEMINI_IMAGE_MODEL: Joi.string().optional(),

  // Redis Configurations
  REDIS_ENABLED: Joi.string().valid('true', 'false').optional(),
  REDIS_URL: Joi.string().optional(),

  // Elasticsearch Configurations
  ELASTICSEARCH_USERS_INDEX: Joi.string().required(),
  ELASTICSEARCH_PATIENTS_INDEX: Joi.string().required(),
  ELASTICSEARCH_NODE: Joi.string().required(),

  //Static Asset Configurations
  STATIC_ASSET_PATH: Joi.string().required(),
  STATIC_ASSET_ORIGIN: Joi.string().required(),

  I18N_FALLBACK_LANGUAGE: Joi.string().required(),

  //Locale
  LOCALE: Joi.string().required(),
  TIME_ZONE: Joi.string().required(),

  // ZarinPal Gateway
  ZARINPAL_MERCHANT_ID: Joi.string().optional(),
  ZARINPAL_SANDBOX: Joi.string().valid('true', 'false').optional(),
  ZARINPAL_CALLBACK_URL: Joi.string().uri().optional(),
  ZARINPAL_CURRENCY: Joi.string().valid('IRR', 'IRT').optional(),
  ZARINPAL_AUTO_VERIFY: Joi.string().valid('true', 'false').optional(),
  ZARINPAL_TIMEOUT_MS: Joi.number().positive().optional(),
  ORDER_TTL_MINUTES: Joi.number().positive().optional(),
});
