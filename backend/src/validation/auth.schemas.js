const Joi = require('joi');

const registerTenantSchema = Joi.object({
  tenantName: Joi.string().min(2).required(),
  subdomain: Joi.string().min(2).required(),
  adminEmail: Joi.string().email().required(),
  adminPassword: Joi.string().min(8).required(),
  adminFullName: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantSubdomain: Joi.string().optional(),
  tenantId: Joi.string().optional(),
});

module.exports = { registerTenantSchema, loginSchema };
