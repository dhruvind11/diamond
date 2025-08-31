import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware';
import { ERROR_MESSAGES } from '../../constants';

class AuthValidation {
  loginValidation = () =>
    validate([
      body('email')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'email')),
      body('password')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password')),
    ]);

  changePasswordValidation = () =>
    validate([
      body('oldPassword')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'oldPassword')),
      body('password')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password'))
        .isLength({ min: 8 })
        .withMessage(
          ERROR_MESSAGES.COMMON.MIN.replace(':attribute', 'password').replace(':min', '8')
        ),
    ]);
}

export default AuthValidation;
