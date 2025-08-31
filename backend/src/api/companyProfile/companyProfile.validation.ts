import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware';
import { ERROR_MESSAGES } from '../../constants';

class CompanyProfileValidation {
  createCompanyValidation = () =>
    validate(
      [
        body('companyName')
          .notEmpty()
          .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyName')),
        body('email')
          .notEmpty()
          .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'email'))
          .isEmail()
          .withMessage(ERROR_MESSAGES.COMMON.PLEASE_VALID.replace(':attribute', 'email')),
        body('password')
          .notEmpty()
          .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password')),
      ],
      {
        allowedKeys: ['companyName', 'address', 'email', 'phone', 'note', 'logoImage', 'password'],
      }
    );
}

export default CompanyProfileValidation;
