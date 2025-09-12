import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware';
import { ERROR_MESSAGES } from '../../constants';

class DiwaliCycleValidation {
  createDiwaliCycleValidation = () =>
    validate([
      body('year')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'year')),
      body('startDate')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'startDate')),
      body('endDate')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'endDate')),
    ]);
}

export default DiwaliCycleValidation;
