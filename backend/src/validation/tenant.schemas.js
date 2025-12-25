const Joi = require('joi');

const addTenantUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(1).required(),
  role: Joi.string().valid('user', 'tenant_admin').default('user')
});

module.exports = {
  addTenantUserSchema
};
