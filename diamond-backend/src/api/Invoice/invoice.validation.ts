import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware';

class InvoiceValidation {
  createInvoiceValidation = () =>
    validate([
      body('companyId')
        .notEmpty()
        .withMessage('companyId is required')
        .isMongoId()
        .withMessage('companyId must be a valid ObjectId'),

      body('createdDate')
        .notEmpty()
        .withMessage('Created date is required')
        .isISO8601()
        .withMessage('Created date must be a valid date'),

      body('dueDate')
        .notEmpty()
        .withMessage('Due date is required')
        .isISO8601()
        .withMessage('Due date must be a valid date'),

      body('sellerId').optional().isMongoId().withMessage('Invalid sellerId'),
      body('buyerId').optional().isMongoId().withMessage('Invalid buyerId'),
      body('brokerId').optional().isMongoId().withMessage('Invalid brokerId'),

      body('items').isArray({ min: 1 }).withMessage('At least one item is required'),

      body('items.*.itemName').notEmpty().withMessage('Item name is required'),

      body('items.*.itemDescription').notEmpty().withMessage('Item description is required'),

      body('items.*.cost').isNumeric().withMessage('Item cost must be a number'),

      body('items.*.quantity').isNumeric().withMessage('Item quantity must be a number'),

      body('items.*.price').isNumeric().withMessage('Item price must be a number'),

      body('subTotal')
        .notEmpty()
        .withMessage('SubTotal is required')
        .isNumeric()
        .withMessage('SubTotal must be a number'),

      body('totalAmount')
        .notEmpty()
        .withMessage('Total amount is required')
        .isNumeric()
        .withMessage('Total must be a number'),

      body('discount')
        .notEmpty()
        .withMessage('Discount is required')
        .isNumeric()
        .withMessage('Discount must be a number'),

      // body('tax')
      //   .notEmpty()
      //   .withMessage('Tax is required')
      //   .isNumeric()
      //   .withMessage('Tax must be a number'),

      // body('paymentStatus')
      //   .notEmpty()
      //   .withMessage('Payment status is required')
      //   .isIn(['pending', 'paid', 'failed'])
      //   .withMessage('Invalid payment status'),

      // body('billStatus')
      //   .notEmpty()
      //   .withMessage('Bill status is required')
      //   .isIn(['draft', 'sent', 'overdue', 'cancelled'])
      //   .withMessage('Invalid bill status'),
    ]);
}
export default InvoiceValidation;
